import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPILE_TIMEOUT_MS, WARMUP_TIMEOUT_MS } from "../../src/core/rules";
import type { RunRequest, WorkerMessage } from "../../src/runners/types";
import { WorkerHost } from "../../src/runners/worker-host";

type Listener = (e: { data?: unknown; message?: string }) => void;

/** Minimal stand-in for a Web Worker. Tests decide how it replies. */
class FakeWorker {
  static all: FakeWorker[] = [];
  listeners: Record<string, Set<Listener>> = { message: new Set(), error: new Set() };
  received: unknown[] = [];
  terminated = false;
  constructor() {
    FakeWorker.all.push(this);
  }
  addEventListener(type: string, fn: Listener) {
    this.listeners[type].add(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners[type].delete(fn);
  }
  postMessage(msg: unknown) {
    this.received.push(msg);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: WorkerMessage) {
    for (const fn of [...this.listeners.message]) fn({ data });
  }
  crash(message: string) {
    for (const fn of [...this.listeners.error]) fn({ message });
  }
  get runRequests() {
    return this.received.filter((m): m is RunRequest => typeof m === "object" && m !== null && "code" in m);
  }
  listenerCount() {
    return this.listeners.message.size + this.listeners.error.size;
  }
}

const flush = () => vi.advanceTimersByTimeAsync(0);

function makeHost() {
  return new WorkerHost("java", { factory: () => new FakeWorker() as unknown as Worker, runTimeoutMs: 5000 });
}

async function warmHost() {
  const host = makeHost();
  const warm = host.warmup();
  FakeWorker.all[0].reply({ warm: true });
  await warm;
  return { host, w: FakeWorker.all[0] };
}

const ok = (id: number, stdout: string) => ({ id, stdout, stderr: "", runMs: 1 });

beforeEach(() => {
  vi.useFakeTimers();
  FakeWorker.all = [];
});
afterEach(() => vi.useRealTimers());

describe("WorkerHost", () => {
  it("returns the worker's result and cleans up listeners", async () => {
    const { host, w } = await warmHost();
    const p = host.run("code");
    await flush();
    w.reply(ok(w.runRequests[0].id, "hi\n"));
    expect((await p).stdout).toBe("hi\n");
    expect(w.listenerCount()).toBe(0);
  });

  it("runs one request at a time, in order", async () => {
    const { host, w } = await warmHost();
    const a = host.run("a");
    const b = host.run("b");
    await flush();
    expect(w.runRequests.map((r) => r.code)).toEqual(["a"]);
    w.reply(ok(w.runRequests[0].id, "A"));
    await a;
    await flush();
    expect(w.runRequests.map((r) => r.code)).toEqual(["a", "b"]);
    w.reply(ok(w.runRequests[1].id, "B"));
    expect((await b).stdout).toBe("B");
  });

  it("run timeout starts only when the program starts, then kills and respawns", async () => {
    const { host, w } = await warmHost();
    const p = host.run("while(true){}");
    await flush();
    const id = w.runRequests[0].id;
    await vi.advanceTimersByTimeAsync(10_000); // long compile is fine
    w.reply({ id, phase: "running" });
    await vi.advanceTimersByTimeAsync(5000);
    const r = await p;
    expect(r.timedOut).toBe("run");
    expect(w.terminated).toBe(true);

    const next = host.run("again");
    await flush();
    const w2 = FakeWorker.all[1];
    w2.reply({ warm: true });
    await flush();
    w2.reply(ok(w2.runRequests[0].id, "back"));
    expect((await next).stdout).toBe("back");
  });

  it("a timeout doesn't affect the run queued behind it", async () => {
    const { host, w } = await warmHost();
    const a = host.run("loop");
    const b = host.run("fine");
    await flush();
    w.reply({ id: w.runRequests[0].id, phase: "running" });
    await vi.advanceTimersByTimeAsync(5000);
    expect((await a).timedOut).toBe("run");
    await flush();
    const w2 = FakeWorker.all[1];
    w2.reply({ warm: true });
    await flush();
    expect(w2.runRequests.map((r) => r.code)).toEqual(["fine"]);
    w2.reply(ok(w2.runRequests[0].id, "ok"));
    const rb = await b;
    expect(rb.timedOut).toBeUndefined();
    expect(rb.stdout).toBe("ok");
  });

  it("a stuck compiler is reported as a compile timeout, not a player timeout", async () => {
    const { host } = await warmHost();
    const p = host.run("code");
    await vi.advanceTimersByTimeAsync(COMPILE_TIMEOUT_MS);
    expect((await p).timedOut).toBe("compile");
  });

  it("warmup failure becomes a runnerError and the next run retries with a fresh worker", async () => {
    const host = makeHost();
    const p = host.run("code");
    await flush();
    FakeWorker.all[0].reply({ warmError: "404 compiler.wasm" });
    const r = await p;
    expect(r.runnerError).toContain("404 compiler.wasm");
    expect(r.timedOut).toBeUndefined();

    const p2 = host.run("code");
    await flush();
    expect(FakeWorker.all).toHaveLength(2);
    const w2 = FakeWorker.all[1];
    w2.reply({ warm: true });
    await flush();
    w2.reply(ok(w2.runRequests[0].id, "fine"));
    expect((await p2).stdout).toBe("fine");
  });

  it("warmup that never answers gives up after the warmup cap", async () => {
    const host = makeHost();
    const p = host.run("code");
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);
    expect((await p).runnerError).toBeTruthy();
  });

  it("a worker crash during a run is a runnerError, not a timeout", async () => {
    const { host, w } = await warmHost();
    const p = host.run("code");
    await flush();
    w.crash("boom");
    const r = await p;
    expect(r.runnerError).toBe("boom");
    expect(r.timedOut).toBeUndefined();
    expect(w.terminated).toBe(true);
  });

  it("kill() settles the active run and rejects a pending warmup", async () => {
    const { host, w } = await warmHost();
    const p = host.run("code");
    await flush();
    host.kill();
    expect((await p).runnerError).toBe("Runner was restarted");
    expect(w.listenerCount()).toBe(0);

    const warm = host.warmup();
    host.kill();
    await expect(warm).rejects.toThrow("stopped");
  });
});

describe("WorkerHost runner failures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWorker.all = [];
  });
  afterEach(() => vi.useRealTimers());

  it("reports a constructor TypeError through warmup's promise and can retry", async () => {
    let attempts = 0;
    const host = new WorkerHost("java", {
      factory: () => {
        if (++attempts === 1) throw new TypeError("Worker could not start");
        return new FakeWorker() as unknown as Worker;
      },
    });
    await expect(host.warmup()).rejects.toThrow("Worker could not start");
    const retry = host.run("code");
    await flush();
    const worker = FakeWorker.all[0];
    worker.reply({ warm: true });
    await flush();
    worker.reply(ok(worker.runRequests[0].id, "recovered"));
    expect((await retry).stdout).toBe("recovered");
  });

  it("does not cache a synchronous warmup message failure", async () => {
    let attempts = 0;
    const host = new WorkerHost("java", {
      factory: () => {
        const worker = new FakeWorker();
        if (++attempts === 1)
          worker.postMessage = () => {
            throw new TypeError("Worker was interrupted");
          };
        return worker as unknown as Worker;
      },
    });
    expect((await host.run("first")).runnerError).toContain("Worker was interrupted");
    expect(FakeWorker.all[0].terminated).toBe(true);
    const retry = host.run("second");
    await flush();
    const worker = FakeWorker.all[1];
    worker.reply({ warm: true });
    await flush();
    worker.reply(ok(worker.runRequests[0].id, "recovered"));
    expect((await retry).stdout).toBe("recovered");
  });

  it("settles a failed run message and keeps the queue usable", async () => {
    const { host, w } = await warmHost();
    w.postMessage = () => {
      throw new TypeError("Worker was interrupted");
    };
    expect((await host.run("first")).runnerError).toBe("Worker was interrupted");
    expect(w.terminated).toBe(true);
    const retry = host.run("second");
    await flush();
    const worker = FakeWorker.all[1];
    worker.reply({ warm: true });
    await flush();
    worker.reply(ok(worker.runRequests[0].id, "recovered"));
    expect((await retry).stdout).toBe("recovered");
  });

  it("replaces a worker that reports runnerError", async () => {
    const { host, w } = await warmHost();
    const p = host.run("code");
    await flush();
    w.reply({ id: w.runRequests[0].id, stdout: "", stderr: "", runnerError: "fatal", runMs: 0 });
    expect((await p).runnerError).toBe("fatal");
    expect(w.terminated).toBe(true);

    const next = host.run("again");
    await flush();
    expect(FakeWorker.all).toHaveLength(2);
    const w2 = FakeWorker.all[1];
    w2.reply({ warm: true });
    await flush();
    w2.reply(ok(w2.runRequests[0].id, "fresh"));
    expect((await next).stdout).toBe("fresh");
  });
});

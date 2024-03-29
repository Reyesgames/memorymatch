"use strict"; {
    async function a(a) {
        if (c) throw new Error("already initialised");
        c = !0;
        const e = a["baseUrl"];
        self.devicePixelRatio = a["devicePixelRatio"];
        const f = a["workerDependencyScripts"].map((a) => {
                let b = a;
                return b = a instanceof Blob ? URL.createObjectURL(a) : new URL(b, e).toString(), b
            }),
            g = [];
        self.runOnStartup = function(a) {
            if ("function" != typeof a) throw new Error("runOnStartup called without a function");
            g.push(a)
        };
        const h = a["engineScripts"].map((a) => new URL(a, e).toString());
        try {
            importScripts(...[...f, ...h])
        } catch (a) {
            return void console.error("[C3 runtime] Failed to load all engine scripts in worker: ", a)
        }
        const i = a["projectScripts"];
        if (i && 0 < i.length) {
            const c = a["projectScriptsStatus"];
            self["C3_ProjectScriptsStatus"] = c;
            try {
                importScripts(...i.map((a) => a[1]))
            } catch (d) {
                return console.error("[Preview] Error loading project scripts: ", d), void b(i, c, a["messagePort"])
            }
        }
        if (a["runOnStartupFunctions"] = g, "preview" === a["exportType"] && "object" != typeof self.C3.ScriptsInEvents) {
            return console.error("[C3 runtime] Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."), void a["messagePort"].postMessage({
                "type": "alert",
                "message": "Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."
            })
        }
        d = self["C3_CreateRuntime"](a), await self["C3_InitRuntime"](d, a)
    }

    function b(a, b, c) {
        let d;
        for (const [e, f] of a)
            if (!b[e]) try {
                importScripts(f)
            } catch (a) {
                return d = "scriptsInEvents.js" === e ? "Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax." : `Failed to load project script '${e}'. Check all your JavaScript code has valid syntax.`, console.error("[Preview] " + d, a), void c.postMessage({
                    "type": "alert",
                    "message": d
                })
            }
    }
    let c = !1,
        d = null;
    self.getGlobal = function(a) {
        if (!a) throw new Error("missing global variable");
        return a
    }, self.addEventListener("message", (b) => {
        const c = b.data,
            d = c["type"];
        if ("init-runtime" === d) a(c);
        else throw new Error(`unknown message '${d}'`)
    })
}
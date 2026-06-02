module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/tamagui.config.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tamagui$2f$config$2f$dist$2f$esm$2f$v3$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tamagui/config/dist/esm/v3.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tamagui$2f$dist$2f$esm$2f$createTamagui$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tamagui/dist/esm/createTamagui.mjs [app-ssr] (ecmascript)");
;
;
const appConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tamagui$2f$dist$2f$esm$2f$createTamagui$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTamagui"])({
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tamagui$2f$config$2f$dist$2f$esm$2f$v3$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"],
    tokens: {
        ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tamagui$2f$config$2f$dist$2f$esm$2f$v3$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"].tokens,
        color: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tamagui$2f$config$2f$dist$2f$esm$2f$v3$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"].tokens.color,
            background: "#0D0D0D",
            foreground: "#EAE6DD",
            primary: "#C8A96B",
            secondary: "#1A1A1A",
            muted: "#5A6A5A",
            border: "#2A2A2A"
        }
    },
    themes: {
        dark: {
            background: "#0D0D0D",
            backgroundHover: "#111111",
            backgroundPress: "#1A1A1A",
            backgroundFocus: "#1A1A1A",
            borderColor: "#2A2A2A",
            borderColorHover: "#C8A96B",
            color: "#EAE6DD",
            colorHover: "#FFFFFF",
            colorPress: "#C8A96B",
            colorFocus: "#EAE6DD",
            placeholderColor: "#5A6A5A",
            outlineColor: "#C8A96B"
        },
        light: {
            background: "#EAE6DD",
            backgroundHover: "#F5F2EC",
            backgroundPress: "#DDD9D0",
            backgroundFocus: "#DDD9D0",
            borderColor: "#C8C4BB",
            borderColorHover: "#C8A96B",
            color: "#0D0D0D",
            colorHover: "#1A1A1A",
            colorPress: "#C8A96B",
            colorFocus: "#0D0D0D",
            placeholderColor: "#8A8A7A",
            outlineColor: "#C8A96B"
        }
    }
});
const __TURBOPACK__default__export__ = appConfig;
}),
"[project]/src/app/providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tamagui$2f$dist$2f$esm$2f$views$2f$TamaguiProvider$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tamagui/dist/esm/views/TamaguiProvider.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$tamagui$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/tamagui.config.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const queryClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClient"]({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1
        }
    }
});
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tamagui$2f$dist$2f$esm$2f$views$2f$TamaguiProvider$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TamaguiProvider"], {
            config: __TURBOPACK__imported__module__$5b$project$5d2f$tamagui$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            defaultTheme: "dark",
            children: children
        }, void 0, false, {
            fileName: "[project]/src/app/providers.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0mp0n_2._.js.map
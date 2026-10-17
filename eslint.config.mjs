import js from "@eslint/js";

export default [
	js.configs.recommended,
	{
		files: ["**/*.user.js"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "script", // 适配油猴脚本的非模块化特性
			globals: {
				// 基础环境
				window: "readonly", document: "readonly", console: "readonly",
				location: "readonly", navigator: "readonly", history: "readonly",
				localStorage: "readonly", sessionStorage: "readonly",
				setTimeout: "readonly", setInterval: "readonly",
				clearTimeout: "readonly", clearInterval: "readonly",
				fetch: "readonly", URL: "readonly", URLSearchParams: "readonly",
				Blob: "readonly", File: "readonly", FormData: "readonly",
				alert: "readonly", confirm: "readonly", prompt: "readonly",
				requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
				MutationObserver: "readonly", HTMLElement: "readonly",
				btoa: "readonly", atob: "readonly", structuredClone: "readonly",

				// GM 环境
				GM: "readonly", GM_info: "readonly", GM_getValue: "readonly", GM_setValue: "readonly",
				GM_deleteValue: "readonly", GM_listValues: "readonly", GM_addStyle: "readonly",
				GM_xmlhttpRequest: "readonly", GM_registerMenuCommand: "readonly",
				GM_openInTab: "readonly", GM_setClipboard: "readonly",
				GM_getResourceText: "readonly", unsafeWindow: "readonly",

				// 第三方库
				$: "readonly", jQuery: "readonly", Swal: "readonly", md5: "readonly"
			}
		},
		rules: {
			"prefer-const": ["error", { "destructuring": "all" }],
			"no-unused-vars": "warn",
			"no-empty": "off",
			"no-useless-escape": "off",
			"no-prototype-builtins": "off",
			"no-control-regex": "off",
			"no-irregular-whitespace": "off"
		}
	}
];
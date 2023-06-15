function getStoredTheme() {
	return localStorage.getItem('theme');
}

function setStoredTheme(theme) {
	localStorage.setItem('theme', theme);
}

function setTheme(theme) {
	if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		document.documentElement.setAttribute('data-bs-theme', 'dark')
	} else {
		document.documentElement.setAttribute('data-bs-theme', theme)
	}
}

setTheme(GetPreferredTheme());

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	const storedTheme = getStoredTheme();
	if (storedTheme !== 'light' && storedTheme !== 'dark') {
		setTheme(GetPreferredTheme());
	}
})

export function GetPreferredTheme() {
	const storedTheme = getStoredTheme()
	if (storedTheme) {
		return storedTheme
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function SetTheme(theme) {
	setStoredTheme(theme)
	setTheme(theme)
}

// ANCHOR User Interface
window.onpopstate = (e) => {
	console.log(`onpopstate appLocation="${appLocation()}`)
	console.dir(e)
	dispatcherSpa(appLocation(), true)
}
/**
 *  Window Load Event
 *  Sets up Event Listeners for various UI elements after the page is fully loaded.
 */
window.onload = (e) => {
	document.querySelectorAll('form').forEach((routeForm) => {
		routeForm.onsubmit = (e) => routeHandleForm(e)
	})
	document.querySelectorAll('a').forEach((routeLink) => {
		routeLink.onclick = (e) => routeHandleLink(e)
	})
	document.querySelectorAll('[role="button"]').forEach((routeButton) => {
		routeButton.onclick = (e) => routeHandleButton(e)
	})
	console.log(`%capp startup navigating to ${appLocation()}`, 'color: white; background: blue; font-size: 150%;')
	dispatcherSpa(appLocation(), true)
}

// ANCHOR Route Tools

function routeHandleButton(e) {
	e.preventDefault()
	const routeButton = e.target
	// console.log(`Route Button=${routeButton}`)
	// console.log(e.target)
	switch (routeButton.dataset.action) {
		case 'route':
			if (routeButton.dataset.route) {
				const destinationRoute = routeButton.dataset.route
				console.log(`destinationRoute=${destinationRoute}`)
				dispatcherSpa(destinationRoute)
			}
			break
		default:
			console.error('Button action unrecognized')
			console.dir(e)
	}
}

function routeHandleForm(e) {
	e.preventDefault()
	const routeForm = e.target
	console.log(`Route Form=${routeRoot(routeForm)}`)
}

function routeHandleLink(e) {
	e.preventDefault()
	const routeLink = e.target.nodeName === 'A' ? e.target : routeRootLink(e.target)
	if (routeLink.dataset.action) {
		switch (routeLink.dataset.action) {
			case 'back':
				history.back()
				break
			case 'href': {
				const destinationURL = new URL(routeLink.href)
				const destinationRoute = destinationURL.pathname.substring(1) + destinationURL.search
				console.log(`destinationURL=${destinationURL} destinationRoute=${destinationRoute}`)
				if (destinationRoute === appLocation()) {
					console.error('Already here')
				} else {
					dispatcherSpa(destinationRoute)
				}
				break
			}
			default:
				console.error('Unknown Action:')
				console.error(`Panel=${routeRoot(routeLink)} Link action=${routeLink.dataset.action} url=${routeLink.href}`)
		}
	} else {
		window.open(routeLink.href, '_blank')
	}
}

function routeRootLink(elementStart) {
	let rootElement = elementStart
	do {
		rootElement = rootElement.parentNode
		// console.log(`Finding Root Link ID: ${rootElement.nodeName}`)
	} while (rootElement.nodeName !== 'A' && rootElement.nodeName !== 'BODY')
	// console.log(`Root Link: ${rootElement.nodeName} = ${rootElement.href}`)
	if (rootElement.nodeName === 'A') {
		return rootElement
	} else {
		return null
	}
}

function routeRoot(elementStart) {
	let rootElement = elementStart
	do {
		rootElement = rootElement.parentNode
		// console.log(`Finding Root ID: id='${rootElement.id}' idSubStr='${rootElement.id.substring(0, 10)}'' nodeName=${rootElement.nodeName}`)
	} while ((rootElement.id === '' || rootElement.id.substring(0, 10) !== 'spa-') && rootElement.nodeName !== 'BODY')
	// console.log(`Root ID: ${rootElement.nodeName} = ${rootElement.id}`)
	if (rootElement.id !== '') {
		return rootElement.id.substring(4)
	} else {
		return null
	}
}

function routeShow(routeID) {
	document.querySelectorAll('section').forEach((route) => {
		console.log(`route=${route.id}`)
		if (route.id === `spa-${routeID}`) {
			route.style.display = 'block'
		} else {
			route.style.display = 'none'
		}
	})
}

// ANCHOR Dispatcher
/**
 *  dispatcherSpa
 *  Sin gle Page Application internal routing
 *
 *  @param {string} routeString - URI
 *  @param {boolean} [routeRedirect] - Replaces rather than adds to the browser history
 */
async function dispatcherSpa(routeString, routeRedirect) {
	const route = routeString.split('/')
	let spaRoute = false
	let spaTitle = ''
	switch (route[0]) {
		case 'key':
			if (route[1] === 'get') {
				apiGetKey()
			} else {
				routeShow('key')
				spaRoute = true
				spaTitle = 'Key Generator'
			}
			break
		case 'og':
			if (route[1] === 'get') {
				apiGetLink()
			} else {
				routeShow('og')
				spaRoute = true
				spaTitle = 'OpenGraph Link'
			}
			break
		case 'steps':
			routeShow('steps')
			spaRoute = true
			spaTitle = 'Steps'
			break
		default:
			routeShow('home')
			spaRoute = true
			spaTitle = 'Home'
	}
	if (spaRoute) {
		if (routeRedirect) {
			history.replaceState(null, null, routeString)
		} else {
			history.pushState(null, null, routeString)
		}
		document.title = `${spaTitle} - Docker, Caddy and Go API SPA`
	}
}

// ANCHOR Utilities
function appLocation() {
	return document.location.pathname.substring(1) + document.location.search
}

// ANCHOR Server API Calls
async function apiGet(apiURL = '', apiMethod = 'POST', apiData = {}) {
	const response = await fetch(apiURL)
	return await response.text()
}
async function apiGetKey() {
	const keyLength = document.getElementById('api-length').value
	const keyDisplay = await apiGet(`/api/v1/key?length=${keyLength}`)
	document.querySelector('#spa-key article').innerHTML = keyDisplay
}
async function apiGetLink() {
	const og = []
	const linkElement = document.querySelector('#spa-og article')
	linkElement.innerHTML = ''
	const linkUrl = document.getElementById('api-url').value
	const linkHTML = await apiGet(`/api/v1/og?url=${linkUrl}`)
	const linkParser = new DOMParser()
	const linkDoc = linkParser.parseFromString(linkHTML, 'text/html')
	const linkTitle = linkDoc.querySelector('title')

	const metaItems = linkDoc.querySelectorAll('head meta')
	for (const metaItem of metaItems) {
		const metaName = metaItem.getAttribute('name')
		const metaProperty = metaItem.getAttribute('property')
		const metaContent = metaItem.getAttribute('content')
		if (metaName) {
			if (metaName.substring(0, 3) === 'og:') {
				og.push({ name: metaName, content: metaContent })
			}
		} else if (metaProperty) {
			if (metaProperty.substring(0, 3) === 'og:') {
				og.push({ name: metaProperty, content: metaContent })
			}
		}
	}
	console.log(linkTitle)
	console.log(og)

	let ogItem, elementAny
	const elementLink = document.createElement('a')
	elementLink.href = linkUrl
	if (og.length > 0) {
		ogItem = og.find(o => o.name === 'og:image')
		if (ogItem) {
			const elementHeader = document.createElement('header')
			const elementImage = document.createElement('img')
			elementImage.src = ogItem.content
			ogItem = og.find(o => o.name === 'og:image:alt')
			if (ogItem) {
				elementImage.alt = ogItem.content
			}
			elementHeader.appendChild(elementImage)
			elementLink.appendChild(elementHeader)
		}
		const elementDiv = document.createElement('div')
		ogItem = og.find(o => o.name === 'og:site_name')
		if (ogItem) {
			elementAny = document.createElement('h4')
			elementAny.innerHTML = ogItem.content
			elementDiv.appendChild(elementAny)
		}
		ogItem = og.find(o => o.name === 'og:title')
		elementAny = document.createElement('h3')
		if (ogItem) {
			elementAny.innerHTML = ogItem.content
		} else if (linkTitle) {
			elementAny.innerHTML = linkTitle
		} else {
			elementAny.innerHTML = linkUrl
		}
		elementDiv.appendChild(elementAny)
		ogItem = og.find(o => o.name === 'og:description')
		if (ogItem) {
			elementAny = document.createElement('p')
			elementAny.innerHTML = ogItem.content
			elementDiv.appendChild(elementAny)
		}
		elementLink.appendChild(elementDiv)
	} else {
		elementLink.href = linkUrl
		if (linkTitle) {
			elementLink.innerHTML = linkTitle
		} else {
			elementLink.innerHTML = linkUrl
		}
	}
	elementLink.onclick = (e) => routeHandleLink(e)
	linkElement.appendChild(elementLink)
	// document.querySelector('#spa-og article').innerHTML = linkDoc.querySelector('head').innerHTML
}

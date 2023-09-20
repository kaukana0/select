/*
a list item's behaviour has 3 aspects:

- isSelectable: call all callbacks
- isCheckable: has a checkbox - multiselect only
- isCollectable: #_selected.length can be >1 - multiselect only

These aspects are encoded as attributes of the <li> items
and are used throughout the code to make decisions.

only some combinations (of the possible 2^3) are supported - i.e. make sense:

- single select item: isSelectable
- multiselect item: isSelectable + isCheckable + isCollectable
- group header w/o text: it's just a seperation line, so none of the three.
- group header w/ text: can be isSelectable + isCheckable or not

*/

import MarkUpCode from  "./markUpCode.mjs"		// keep this file html/css free

// magic strings
const ms = {
	domElementIds: {
		headBox: 'headBox',     				// the select box (with a little down arrow inside)
		headBoxContent: 'headBoxContent',		// mostly the same as a list entry (text and possibly image), possibly styled differently
		list: 'DropdownList',           		// list below the box; initially invisible
		listItemPrefix: 'ListItem',				// prefix for ids
		spacer: 'spacer'						// pushes the little down arrow in the headbox over to the right
	},
}


// note: the purpose of using requestAnimationFrame() here is to make sure 
// that an element - which we want to access immediately - actually exists.
// seems that .innerHTML takes a while "asynchroneously"...
class Element extends HTMLElement {

	#_isMultiselect	// bool; from an attribute
	#_onSelect 			// function; from an attribute; callback before a selection happens; if returns false, (de)selection is avoided, allowed in any other case
	#_onSelected		// function; from an attribute; callback after a selection happened
	#_hasFavoriteStar	// bool; from an attribute; for each entry, show fav star on the right side in the line area
	#_currentFavStar	// key of current favourite
	#_fractions		// # of fractions of left side of the listitem list (relevent only for favoriteStar. see docu.md)
	#_selected = new Map()
	#_isLocked		// if true, user can't influece selection and no callback will be invoked
	#_orderedItems	// for instance ["European Union","Austria",...]
	#_defaultSelections		// [] of keys
	#_isInitialized
	#_textForMultiselect	// what should be displayed if multiple are selected. eg "items selected"
	#_disabledSelections	// [] of keys

	#$(elementId) {
		return this.shadowRoot.getElementById(elementId)
	}

	constructor() {
		super()

		this.#_isInitialized = false
		this.#_isLocked = false
		this.#_orderedItems = []
		this.#_currentFavStar = ""
		this.#_defaultSelections = []
		this.#_disabledSelections = []

		this.attachShadow({ mode: 'open' })
		const tmp = MarkUpCode.getHtmlTemplate(MarkUpCode.mainElements(ms) + MarkUpCode.css(ms, 5)).cloneNode(true)
		this.shadowRoot.appendChild(tmp)
	}

	#registerEvents() {
			this.#$(ms.domElementIds.headBox).addEventListener('click', (ev) => this.#toggleVisibility(ev))
			this.#$(ms.domElementIds.headBox).addEventListener('keydown', (e) => {
				if(e.keyCode == 13 || e.keyCode == 32) {
					this.#toggleVisibility(e)
				}
				if(e.keyCode == 27) {
					this.#$(ms.domElementIds.list).style.display = "none"
				}
		})
	}

	connectedCallback() {
		this.#_isMultiselect = this.hasAttribute('multiselect') ? true : false
		this.#_hasFavoriteStar = this.hasAttribute('favoriteStar') ? true : false
		this.#_fractions = this.hasAttribute('fractions') ? this.getAttribute('fractions') : 99		// the higher, the more towards 1 column
		if(!this.#_isInitialized) {
			this.#registerEvents()	
			this.#makeDismissable()
			this.#_isInitialized = true
		}
	}

	disconnectedCallback() { console.debug("ecl-like-select-x: disconnected")	}

	set data(val) {	this.#fill(val[0], val[1]) }

	set onSelect(val) {
		if(this.#_onSelect) { console.debug("select: onSelect already set") }
		this.#_onSelect = val
	}

	set onSelected(val) {
		if(this.#_onSelected) { console.debug("select: onSelected already set") }
		this.#_onSelected = val
	}

	get onSelected() { return this.#_onSelected }
	get onSelect() { return this.#_onSelect }

	// keys = []
	// does not invoke onSelect or onSelected
	set selected(keys) {
		//console.log(keys)	//TODO: why is this undefined? (context: test insertAndHookUpBoxes)
		if(typeof keys !== "undefined" && keys!==null) {
			if(keys.length===0) {
				this.#deselectAll()
				// nothing else to do
			} else {
				let isFirst = true
				for(let key of keys) {
					const val = this.#getValueByKey(key)
					if(val!==null) {
						if(isFirst) {
							isFirst = false
							this.#deselectAll()
						}
						this.#selectOne(key)
					} else {
						console.warn(`ecl-like-select-x: set selected - key "${key}" doesn't exist.`)
					}
				}
			}
		}
	}

	get selected() { return this.#_selected	}

	get favoriteStar() { return this.#_currentFavStar	}

	set locked(isLocked) { this.#_isLocked = isLocked	}

	set defaultSelections(val) { this.#_defaultSelections = val	}

	set textForMultiselect(val) {
		this.#_textForMultiselect = val
		this.#updateHeadBoxContent()
	}

	set disabledSelections(val) { this.#_disabledSelections = val }


	static get observedAttributes() {
		return ['data', 'onSelect', 'onSelected', 'style', 'multiselect', 'textformultiselect']
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (["onSelected", "onSelect", "data"].includes(name)) {
			console.warn("ecl-like-select-x: setting "+name+" via html attribute is being ignored. please use js property instead.")
		}
		if(name === 'multiselect') {
			this.connectedCallback()
			if(this.#_selected.size > 0) {
				this.#_isMultiselect = newVal === "true"
				if(!this.#_isMultiselect) {	// when being switched off, select 1
					this.#deselectAll()
					if(this.#_currentFavStar === "") {
						this.#selectOne(this.#_selected.keys()[0])
					} else {
						this.#selectOne(this.#_currentFavStar)
					}
				}
			}
		}
		if(name === 'style') {
			if(newVal) {
				// relay anyting to this element's main container
				this.#$(ms.domElementIds.headBox).style.cssText = this.#$(ms.domElementIds.headBox).style.cssText+newVal
			}
		}
		if(name === 'textformultiselect') {
			this.textForMultiselect = newVal
		}
	}

	// note: very naive. collision prone!
	#stringHash(obj) {
		let retVal = obj
		if(typeof obj === "object" && obj!==null) {
			retVal=""
			const str = JSON.stringify(obj)
			for(let ci in str) {
				retVal += str.charCodeAt(ci)
			}
		}
		return retVal
	}

	#fill(itemsMap, groups) {
		const that = this

		if(itemsMap) {
			let isFirstEntry = true
			let hasText = false		// span multiple possible group-entries in case header has text.
			for (const [key, val] of itemsMap.entries()) {
				const enabled = !this.#_disabledSelections.includes(key)
				const groupText = insertGroupItem(groups, key, isFirstEntry, enabled)
				if(groupText[0]) {hasText=groupText[1]!==""}
				insertItem(key, val, hasText, enabled)
				if(enabled) {
					addEventListeners(key, val)
				}
				setInitiallySelected(key, groupText[1])

				this.#_orderedItems.push(val)
				isFirstEntry = false
			}
			this.#invokeCallback("", "")
		} else {
			throw Error("ecl-like-select-x: empty input")
		}

		// returns [a,b], a=true if group exists and b=text of group
		function insertGroupItem(groups, key, isFirstEntry, enabled) {
			if(groups && groups.has(key)) {
				const text = typeof groups.get(key).text === "undefined" ? "" : groups.get(key).text
				const selectable = typeof groups.get(key).selectable === "undefined" ? false : groups.get(key).selectable
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.groupHeader(ms, text, selectable, !isFirstEntry && text==="", enabled)
				if(selectable && enabled) {
					const elId = ms.domElementIds.listItemPrefix + text
					window.requestAnimationFrame(() => that.#$(elId).onclick = (ev) => {
						that.#onListItemClick(text, text)
						ev.stopPropagation()	// don't close dropdown list
					})
				}
				return [true, text]
			}
			return [false, ""]
		}

		function insertItem(key, val, indent, enabled) {
			if(that.#_isMultiselect) {
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.multiSelectItem(ms, that.#stringHash(key), val, that.#_hasFavoriteStar, that.#_fractions, indent, enabled)
			} else {
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.singleSelectItem(ms, that.#stringHash(key), val, enabled)
			}
		}

		function addEventListeners(key, val) {
			const elId = ms.domElementIds.listItemPrefix + that.#stringHash(key)
			window.requestAnimationFrame(() => that.#$(elId).onclick = (ev) => {

				if( ev.target.hasAttribute("favstar") ) {
					that.#setFavorite(key)
				} 

				that.#onListItemClick(key, val)

				if(that.#_isMultiselect) {
					ev.stopPropagation()	// don't close dropdown list
				}
			})

			window.requestAnimationFrame(() => that.#$(elId).onkeydown = (e) => {
				if(e.keyCode==13) {
					that.#onListItemClick(key, val)
				}
			})
		}

		function setInitiallySelected(key, text) {
			if(that.#_defaultSelections.length === 0) {
				if(that.#_selected.size === 0) {	// initially (1st element)
					that.#selectOne(key)
					if( that.#_hasFavoriteStar ) { that.#setFavorite(key) }
				}
			} else {
				if(that.#_defaultSelections.includes(key)) {
					that.#selectOne(key)
					if( that.#_hasFavoriteStar && that.#_currentFavStar==="" ) {
						that.#setFavorite(key)
					}
				}
				if(that.#_defaultSelections.includes(text)) {	// for header items key===value; called "text" here
					that.#selectOne(text)
				}
			}
		}

	}

	// you wanna search everything, go thorugh the DOM as there's no other list in here which is exhaustive
	#getValueByKey(key) {
		var items = this.#$(ms.domElementIds.list).getElementsByTagName("li");
		for (var i = 0; i < items.length; ++i) {
			if(items[i].getAttribute("key") === key) {return items[i].getAttribute("val")}
		}
		return null
	}

	#selectOne(key) {
		const elId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		const el = this.#$(elId)
		const val = el.getAttribute("val")
		if(!this.#_isMultiselect) {	this.#deselectAll()	}		// max 1
		if(el) {
			if(el.hasAttribute("isCollectable") || !this.#_isMultiselect) {
				this.#_selected.set(key,val)
			}
			this.#setChecked(el, true)
			this.#updateHeadBoxContent()
		} else {
			console.warn("ecl-like-select-x: can't select missing element", elId)
		}
	}

	#setChecked(el, isChecked) {
		if(el.hasAttribute("isCheckable")) {
			if(isChecked) {
				el.firstElementChild.firstElementChild.firstElementChild.setAttribute("checked", true)
			} else {
				el.firstElementChild.firstElementChild.firstElementChild.removeAttribute("checked")
			}
		}
	}

	#deselectAll() {
		var items = this.#$(ms.domElementIds.list).getElementsByTagName("li");
		for (var i = 0; i < items.length; ++i) {
			this.#setChecked(items[i], false)
		}
		this.#_selected.clear()
	}

	#setFavorite(key) {
		if(this.#_currentFavStar !== "") {
			const currentElId = ms.domElementIds.listItemPrefix + this.#stringHash(this.#_currentFavStar)
			this.#$(currentElId).querySelector("div [favstar]").innerHTML= MarkUpCode.button("star", "favstar")
		}
		const newElId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		this.#$(newElId).querySelector("div [favstar]").innerHTML = MarkUpCode.button("starFilled", "favstar")
		this.#_currentFavStar=key
	}

	#updateHeadBoxContent() {
		const selectedCount = this.#_isMultiselect ? this.#_selected.size : null
		const text = (this.#_textForMultiselect && this.#_isMultiselect && this.selected.size>1) ? this.#_textForMultiselect : Array.from(this.#_selected.values()).join()
		const html = MarkUpCode.headBoxContent(text, selectedCount)
		this.#$(ms.domElementIds.headBoxContent).innerHTML = html
	}

	#onListItemClick(key, val) {
		if(this.#_isLocked) return
		const that = this
		const elId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		const el = this.#$(elId)

		if(this.#_isMultiselect) {
			if(el.hasAttribute("isGroupStart")) {
				this.#deselectAll()
				this.#selectOne(key)
				let next = el.nextElementSibling
				while(next && !next.hasAttribute("isGroupStart")) {
					if( !this.#_disabledSelections.includes(next.getAttribute("key")) ) {
						this.#selectOne(next.getAttribute("key"))
					}
					next = next.nextElementSibling
				}
				action()
			} else {
				handleMultiSelectClick(el)
			}
		} else {
			handleSingleSelectClick()
		}

		function handleMultiSelectClick(el) {
			if(that.#_selected.has(key)) {
				if(that.#_selected.size > 1) {
					if(that.#_onSelect && that.#_onSelect(key,val)===false) {return} 
					that.#_selected.delete(key)
					that.#setChecked(el, false)
					action()
				} else {
					// nop (at least 1 has to be selected at all times)
				}
			} else {
				if(that.#_onSelect && that.#_onSelect(key,val)===false) {return} 
				that.#selectOne(key)
				alignOrderOfSelectedItems()
				if(el.hasAttribute("isSelectable")) {
					action()
				}
			}
		}

		function alignOrderOfSelectedItems() {		// ...to the order of ecl-like-select-x items - and do it by value
			that.#_selected = new Map([...that.#_selected.entries()].sort(
				(e,f) => {
					const a = that.#_orderedItems.findIndex(_e => _e === Object.entries(f)[0][1])
					const b = that.#_orderedItems.findIndex(_e => _e === Object.entries(e)[0][1])
					return a>b ? -1:1
				}
			))
		}
	
		function handleSingleSelectClick() {
			const selectionChanged = key !== that.#_selected.keys().next().value
			if(selectionChanged) {
				that.#selectOne(key)
				action()
			} else {
				// nop
			}
		}

		function action() {
			that.#updateHeadBoxContent()
			that.#invokeCallback(key, val)
		}

	}
	
	// return undefined is the same as true
	#invokeCallback(key,val) {
		if(this.#_onSelected !== undefined) {
			this.#_onSelected(key, val)
		} else {
			console.debug("ecl-like-select-x: No onSelected callback")
		}
	}

	#getCurrentlySingleSelectedElement() {
		if(this.#_selected.size>0) {
			if(this.#_isMultiselect) {
				console.warn("ecl-like-select-x: not a single-select box")
				return
			} else {
				const selecedElId = ms.domElementIds.listItemPrefix + this.#_selected.keys().next().value
				return this.#$(selecedElId)
			}
		} else {
			return
		}
	}

	#toggleVisibility(ev) {
		const list = this.#$(ms.domElementIds.list)
		const isCurrentlyVisible = list.style.display !== "block"

		isCurrentlyVisible ? list.style.display = "block" : list.style.display = "none"

		if(!this.#_isMultiselect && isCurrentlyVisible) {
			const selEl = this.#getCurrentlySingleSelectedElement()
			//if(selEl) { selEl.scrollIntoView() }
			// note: the list stores where it was last scrolled to.
			// so, if for instance, you select the first item and scroll all the way down,
			// without this, it would stay down, with this, it's scrolled topmost
		}

		//if(ev) { ev.stopPropagation() }
	
		// note: clicks anywhere else other than this component are handled under dismissability
	}

	#makeDismissable() {
		// note: use element in light DOM, not any element from inside this component
		document.addEventListener('click', (e) => {
			if(e.target.id != this.id) {
				const el = this.#$(ms.domElementIds.list)
				el.style.display = "none"
			}
		})
	}

	selectDefaults() {
		this.#deselectAll()
		var items = this.#$(ms.domElementIds.list).getElementsByTagName("li");
		if(this.#_defaultSelections.length===0) {
			this.#selectOne(items[0].getAttribute("key"))
		} else {
			for (let i = 0; i < items.length; i++) {
				if( this.#_defaultSelections.includes(items[i].getAttribute("key")) ) { 
					this.#selectOne(items[i].getAttribute("key"))
				}
			}
		}
	}

}

window.customElements.define('ecl-like-select-x', Element)

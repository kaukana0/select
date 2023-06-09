/*
a list item's behaviour has 3 aspects:

- isSelectable: call all callbacks
- isCheckable: has a checkbox - multiselect only
- isCollectable: #_selected.length can be >1 - multiselect only

only some combinations (of the possible 2^3) are supported - i.e. make sense:

- single select item: isSelectable
- multiselect item: isSelectable + isCheckable + isCollectable
- group header w/o text: it's just a seperation line, so none of the three.
- group header w/ text: can be isSelectable or not

these aspects are encoded as attributes of the <li> items.
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

	set zindex(val) { this.setAttribute("zindex", val) }

	set locked(isLocked) { this.#_isLocked = isLocked	}

	set defaultSelections(val) { this.#_defaultSelections = val	}


	static get observedAttributes() {
		return ['data', 'onSelect', 'onSelected', 'style', 'multiselect', 'zindex']
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (["onSelected", "onSelect", "data"].includes(name)) {
			console.warn("ecl-like-select-x: setting "+name+" via html attribute is being ignored. please use js property instead.")
		}
		if(name === 'multiselect') {
			this.connectedCallback()
			if(this.#_selected.size > 0) {
				this.#_isMultiselect = newVal === "true"
				this.#deselectAll()
				if(this.#_currentFavStar === "") {
					this.#selectOne(this.#_selected.keys()[0])
				} else {
					this.#selectOne(this.#_currentFavStar)
				}
			}
		}
		if(name === 'style') {
			if(newVal) {
				// relay anyting to this element's main container
				this.#$(ms.domElementIds.headBox).style.cssText = this.#$(ms.domElementIds.headBox).style.cssText+newVal
			}
		}
	}

	// note: very naive. collision prone!
	#stringHash(obj) {
		let retVal = obj
		if(typeof obj === "object" && obj!==null) {
			retVal=""
			const str = JSON.stringify(obj)
			let i=1
			for(let ci in str) {
				retVal += str.charCodeAt(ci)
			}
		}
		return retVal
	}

	// note: the purpose of using requestAnimationFrame() here is to make sure 
	// that an element - which we want to access - actually exists.
	// seems that .innerHTML takes a while "asynchroneously"...
	#fill(itemsMap, groupChanges) {
		const that = this

		if(itemsMap) {
			let isFirstEntry = true
			for (const [key, val] of itemsMap.entries()) {
				insertGroupItem(groupChanges, key, isFirstEntry)
				insertItem(key, val)
				addEventListeners(key, val)
				setInitiallySelected(key)

				this.#_orderedItems.push(val)
				isFirstEntry = false
			}
			this.#invokeCallback("", "")
		} else {
			throw Error("ecl-like-select-x: empty input")
		}


		function insertGroupItem(groupChanges, key, isFirstEntry) {
			// TODO: no line if 1st in list
			if(groupChanges && groupChanges.has(key)) {
				const text = typeof groupChanges.get(key).text === "undefined" ? "" : groupChanges.get(key).text
				const selectable = typeof groupChanges.get(key).selectable === "undefined" ? false : groupChanges.get(key).selectable
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.groupHeader(ms, text, selectable, !isFirstEntry)
				if(selectable) {
					const elId = ms.domElementIds.listItemPrefix + text
					window.requestAnimationFrame(() => that.#$(elId).onclick = (ev) => {
						that.#onListItemClick(text, text)
						ev.stopPropagation()	// don't close dropdown list
					})
				}
			}
		}

		function insertItem(key, val) {
			if(that.#_isMultiselect) {
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.multiSelectItem(ms, that.#stringHash(key), val, that.#_hasFavoriteStar, that.#_fractions)
			} else {
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.singleSelectItem(ms, that.#stringHash(key), val)
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

		function setInitiallySelected(key) {
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
		if( !el.hasAttribute("isCollectable") || !this.#_isMultiselect ) {
			this.#deselectAll()				// max 1
		}
		if(el) {
			this.#_selected.set(key,val)
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
		const html = MarkUpCode.headBoxContent(Array.from(this.#_selected.values()).join(), selectedCount)
		this.#$(ms.domElementIds.headBoxContent).innerHTML = html
	}

	#onListItemClick(key, val) {
		const that = this

		if(this.#_isLocked) return
		
		if(that.#_isMultiselect) {
			handleMultiSelectClick()
		} else {
			handleSingleSelectClick()
		}

		function handleMultiSelectClick() {
			
			const elId = ms.domElementIds.listItemPrefix + that.#stringHash(key)
			if(that.#_selected.has(key)) {
				if(that.#_selected.size > 1) {
					if(that.#_onSelect && that.#_onSelect(key,val)===false) {return} 
					that.#_selected.delete(key)
					//that.#$(elId).firstElementChild.firstElementChild.firstElementChild.removeAttribute("checked")
					that.#setChecked(that.#$(elId), false)
					action()
				} else {
					// nop (at least 1 has to be selected at all times)
				}
			} else {
				if(that.#_onSelect && that.#_onSelect(key,val)===false) {return} 
				that.#selectOne(key)
				alignOrderOfSelectedItems()
				if(that.#$(elId).hasAttribute("isSelectable")) {
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

		//ev.stopPropagation()
	
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

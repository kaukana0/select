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
		listContainer: 'listContainer',
		btn: "btn",
		btnC: "btnContainer"
	},
}


// note: the purpose of using requestAnimationFrame() here is to make sure 
// that an element - which we want to access immediately - actually exists.
// seems that .innerHTML takes a while "asynchroneously"...
class Element extends HTMLElement {

	#_isMultiselect	// bool; from an attribute
	#_onSelect 			// function; from an attribute; callback before a selection happens; if returns false, (de)selection is avoided, allowed in any other case. passes (key,value,isDeselect) to callback.
	#_onSelected		// function; from an attribute; callback after a selection happened
	#_hasFavoriteStar	// bool; from an attribute; for every entry, show fav star on the right side in the line area
	#_currentFavStar	// key of current favourite
	#_fractions		// # of fractions of left side of the listitem list (relevent only for favoriteStar. see docu.md)
	#_selected = new Map()
	#_isLocked		// if true, user can't influece selection and no callback will be invoked
	#_orderedItems	// for instance ["European Union","Austria",...]
	#_defaultSelections		// [] of keys
	#_isInitialized
	#_textForMultiselect	// what should be displayed if multiple are selected. eg "items selected"
	#_disabledSelections	// [] of keys
	#_displayKeys	// bool; from an attribute; for each entry, show it's key in a right-aligned column
	#_displayKeyInHeadbox		// right aligned
	#_hasReset

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
		this.#_hasReset = false

		this.#_fractions = this.hasAttribute('fractions') ? this.getAttribute('fractions') : 99		// the higher, the more towards 1 column

		this.attachShadow({ mode: 'open' })
		const tmp = MarkUpCode.getHtmlTemplate(MarkUpCode.mainElements(ms) + MarkUpCode.css(ms, 5)).cloneNode(true)
		this.shadowRoot.appendChild(tmp)
	}

	#registerEvents() {
			this.#$(ms.domElementIds.headBox).addEventListener('click', (ev) => this.#setVisible())
			this.#$(ms.domElementIds.headBox).addEventListener('keydown', (e) => {
				if(e.keyCode == 13 || e.keyCode == 32) {
					this.#setVisible()
				}
				if(e.keyCode == 27) {
					this.#setVisible(false)
				}
		})
		this.#$(ms.domElementIds.btn).addEventListener('click', (ev) => {
			this.selectDefaults()
			this.#invokeCallback()
		})
	}

	connectedCallback() {
		this.#_isMultiselect = this.hasAttribute('multiselect') ? this.getAttribute('multiselect')==="true" : false
		this.#_hasFavoriteStar = this.hasAttribute('favoriteStar') ? this.getAttribute('favoriteStar')==="true" : false
		this.#_displayKeys = this.hasAttribute('displaykeys') ? this.getAttribute('displaykeys')==="true" : false
		if(!this.#_isInitialized) {
			this.#registerEvents()	
			this.#makeDismissable()
			this.#_isInitialized = true
		}
	}

	disconnectedCallback() { console.debug("ecl-like-select-x: removed from document", this.getAttribute("id"))	}
	adoptedCallback() { console.debug("ecl-like-select-x: moved to another document", this.getAttribute("id"))	}

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
		return ['data', 'onSelect', 'onSelected', 'multiselect', 'textformultiselect', 'displaykeys', 'fractions', 'resetbutton', 'displaykeyinheadbox']
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (["onSelected", "onSelect", "data"].includes(name)) {
			console.warn("ecl-like-select-x: setting "+name+" via html attribute is being ignored. please use js property instead.")
		}
		if(name === 'multiselect') {
			this.connectedCallback()
			this.#_isMultiselect = newVal === "true"
			if(this.#_selected.size > 1) {
				if(this.#_isMultiselect) {
					this.#updateHeadBoxContent()
					this.#updateResetButton()
				} else {
					// when being switched off, select first or fav
					if(this.#_currentFavStar === "") {
						this.#selectOne(this.#_selected.keys().next().value)
					} else {
						this.#selectOne(this.#_currentFavStar)
					}
				}
			} else {
				this.#updateHeadBoxContent()
				this.#updateResetButton()
			}
		}

		if(name === 'textformultiselect') {
			this.#_textForMultiselect = newVal
		}

		if(name === 'displaykeys') {
			this.#_displayKeys = newVal === "true"
		}

		if(name === 'fractions') {
			this.#_fractions = newVal
			console.error("ecl-like-select-x: setting fractions at runtime is not supported")
		}

		if(name === 'resetbutton') {
			this.#_hasReset = newVal==="true"
		}

		if(name === 'displaykeyinheadbox') {
			this.#_displayKeyInHeadbox = newVal==="true"
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
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.multiSelectItem(ms, that.#stringHash(key), val, that.#_hasFavoriteStar, that.#_fractions, indent, enabled, that.#_displayKeys)
			} else {
				that.#$(ms.domElementIds.list).innerHTML += MarkUpCode.singleSelectItem(ms, that.#stringHash(key), val, enabled, that.#_fractions)
			}
		}

		function addEventListeners(key, val) {
			const elId = ms.domElementIds.listItemPrefix + that.#stringHash(key)

			window.requestAnimationFrame(() => {
				const el = that.#$(elId)

				el.onclick = (ev) => {
					that.#onListItemClick(key, val)
					if(that.#_isMultiselect) {
						ev.stopPropagation()	// don't close dropdown list
					}
				}

				const favStar = el.querySelector("symbol-button")
				if(favStar) {
					favStar.addEventListener("action", (ev)=> {
						that.#setFavorite(key)
						ev.stopPropagation()
					},
					true)
				}

				el.onkeydown = (e) => {
					if(e.key=="Enter" && e.target.nodeName!=="SYMBOL-BUTTON") {
						that.#onListItemClick(key, val)
					}
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
			this.#updateResetButton()
		} else {
			console.warn("ecl-like-select-x: can't select, element doesn't exist", elId)
		}
	}

	#setChecked(el, isChecked) {
		if(el.hasAttribute("isCheckable")) {
			if(isChecked) {
				el.firstElementChild.firstElementChild.firstElementChild.setAttribute("checked", true)
				el.firstElementChild.firstElementChild.firstElementChild.setAttribute("aria-selected", true)
			} else {
				el.firstElementChild.firstElementChild.firstElementChild.removeAttribute("checked")
				el.firstElementChild.firstElementChild.firstElementChild.setAttribute("aria-selected", false)
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
			this.#$(currentElId).querySelector("div symbol-button").setActivated=false
		}

		const newElId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		this.#$(newElId).querySelector("div symbol-button").setActivated=true

		this.#_currentFavStar=key
	}

	#updateHeadBoxContent() {
		const selectedCount = this.#_isMultiselect ? this.#_selected.size : null
		const useMultiselectText = this.#_textForMultiselect && this.#_isMultiselect && this.selected.size>1
		const text = useMultiselectText ? this.#_textForMultiselect : Array.from(this.#_selected.values()).join()
		const rightAlignedText = this.#_displayKeyInHeadbox && !useMultiselectText ? this.selected.keys().next().value : ""
		const html = MarkUpCode.headBoxContent(text, selectedCount, rightAlignedText)
		this.#$(ms.domElementIds.headBoxContent).innerHTML = html
	}

	#isDeselect(key) { return Array.from( this.#_selected.keys() ).includes(key) }

	#onListItemClick(key, val) {
		if(this.#_isLocked) return
		const that = this
		const elId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		const el = this.#$(elId)

		if(this.#_isMultiselect) {
			if(el.hasAttribute("isGroupStart")) {
				if(that.#_onSelect && that.#_onSelect(key,val,this.#isDeselect(key))===false) {return}
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
					if(that.#_onSelect && that.#_onSelect(key,val,that.#isDeselect(key))===false) {return} 
					that.#_selected.delete(key)
					that.#setChecked(el, false)
					action()
				} else {
					// nop (at least 1 has to be selected at all times)
				}
			} else {
				if(that.#_onSelect && that.#_onSelect(key,val,that.#isDeselect(key))===false) {return} 
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
				if(that.#_onSelect && that.#_onSelect(key,val,that.#isDeselect(key))===false) {return} 
				that.#selectOne(key)
				action()
			} else {
				// nop
			}
		}

		function action() {
			that.#updateResetButton()
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


	/*
		note on changing CSS for pseudo elements:
		style.add / remove doesn't exist for pseudo elements.
		while there is getComputedStyle, setComputedStyle is missing.
	*/
	#setVisible(is) {
		const list = this.#$(ms.domElementIds.listContainer)
		let isCurrentlyVisible = list.style.display !== "" && list.style.display !== "none"
	
		if(typeof is === "undefined") {
			// toggle
			list.style.display = isCurrentlyVisible ? "none" : "block"
		} else {
			list.style.display = is ? "block" : "none"
		}

		isCurrentlyVisible = list.style.display !== "" && list.style.display !== "none"

		if(isCurrentlyVisible) {
			this.#$(ms.domElementIds.headBox).classList.add("pointUp")
		} else {
			this.#$(ms.domElementIds.headBox).classList.remove("pointUp")
		}
	}


	#makeDismissable() {
		// note: use element in light DOM, not any element from inside this component
		document.addEventListener('click', function(e) {
			if(e.target.id != this.id) {
				//const el = this.#$(ms.domElementIds.listContainer)
				//el.style.display = "none"
				this.#setVisible(false)
			}
		}.bind(this))
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

	#updateResetButton() {
		this.#$(ms.domElementIds.btnC).style.display = this.#_hasReset===true && !this.#isDefaultSelected() ?"inline-block":"none"
	}

	#isDefaultSelected() {
		if(this.#_defaultSelections.length === 0) {
			// anything else then the 1st one selected?
			var items = this.#$(ms.domElementIds.list).getElementsByTagName("li");
			for (let i = 1; i < items.length; i++) {
				if(items[i].hasAttribute("ischeckable") && items[i].firstElementChild.firstElementChild.firstElementChild.hasAttribute("checked")) {
					return false
				}
			}
			return true
		} else {
			
			if(this.#_selected.size === this.#_defaultSelections.size) {
				
				let retVal = true
				for (let [key, _] of this.#_selected) {
					if(!this.#_defaultSelections.includes(key)) {retVal=false}
				}
				return retVal

			} else {
				return false
			}
		}
	}

}

window.customElements.define('ecl-like-select-x', Element)

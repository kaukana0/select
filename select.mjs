/*
- to be implemented:
  ok - fav star
  ok - blue circle
  ok - comma separated list of selections
  - ECL arrow
	- ECL style CSS
	- ECL style checkbox
	- fav Star image
	- test single-select mode
  ok - selectionAllowed callback
  ok - group check-all checkbox
	ok - checkbox no haken
	ok - single select highlight w/o haken
	- let user specify what is select initially (now always the first one)
- to be removed:
	ok - mini images
*/

/*
a list item's behaviour has 3 aspects:

- isSelectable: call all callbacks
- isCheckable: has a checkbox - multiselect only
- isCollectable: #_selected.length can be >1 - multiselect only

only some combinations (of the possible 2^3) are supported - i.e. make sense in this context:

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

	#_imagePath		// string; from an attribute
	#_isMultiselect	// bool; from an attribute
	#_onSelect 			// function; from an attribute; callback before a selection happens; if returns false, (de)selection is avoided, allowed in any other case
	#_onSelected		// function; from an attribute; callback after a selection happened
	#_hasFavoriteStar	// bool; from an attribute; for each entry, show fav star on the right side in the line area
	#_currentFavStar	// key of current favourite
	#_fractions		// # of fractions of left side of the listitem list (relevent only for favoriteStar. see docu.md)
	#_selected = new Map()
	#_isLocked		// if true, user can't influece selection and no callback will be invoked
	#_orderedItems	// for instance ["European Union","Austria",...]
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
		this.#_imagePath = this.getAttribute('imagePath') || ""
		this.#_isMultiselect = this.hasAttribute('multiselect') ? true : false
		this.#_hasFavoriteStar = this.hasAttribute('favoriteStar') ? true : false
		this.#_fractions = this.hasAttribute('fractions') ? this.getAttribute('fractions') : 3
		if(!this.#_isInitialized) {
			this.#registerEvents()	
			this.#makeDismissable()
			this.#_isInitialized = true
		}
	}

	disconnectedCallback() {
		console.debug("ecl-like-select-x: disconnected")
	}

	set data(val) {
		this.#fill(val[0], val[1])
	}

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
						this.#selectOne(key,val)
					} else {
						console.warn(`ecl-like-select-x: set selected - key "${key}" doesn't exist.`)
					}
				}
			}
		}
	}

	get selected() {
		return this.#_selected
	}

	get favoriteStar() {
		return this.#_currentFavStar
	}

	set zindex(val) {
		this.setAttribute("zindex", val)
	}

	set locked(isLocked) {
		this.#_isLocked = isLocked
	}


	static get observedAttributes() {
		return ['data', 'onSelect', 'onSelected', 'imagePath', 'multiselect', 'zindex']
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (["onSelected", "onSelect", "data"].includes(name)) {
			console.warn("ecl-like-select-x: setting "+name+" via html attribute is being ignored. please use js property instead.")
		}
		if (name === 'imagePath') {
			if(this.#_imagePath === undefined) {
				this.#_imagePath = newVal
				// todo: clear and re-fill
			} else {
				console.warn("ecl-like-select-x: setting imagePath works only one time. It's ignored now.")
			}
		}
		if(name === 'multiselect') {
			// switch multiselect on/off.
			// warning: switch to off while multiple items are selected is untested.
			this.connectedCallback()
		}
		if(name === 'zindex') {
			if(newVal) {
				this.#$(ms.domElementIds.list).style.zIndex=newVal
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
	// TODO: function is too big...
	#fill(itemsMap, groupChanges) {
		if(itemsMap) {
			for (const [key, val] of itemsMap.entries()) {

				// TODO: no line if 1st in list
				if(groupChanges && groupChanges.has(key)) {
					const text = typeof groupChanges.get(key).text === "undefined" ? "" : groupChanges.get(key).text
					const selectable = typeof groupChanges.get(key).selectable === "undefined" ? false : groupChanges.get(key).selectable
					this.#$(ms.domElementIds.list).innerHTML += MarkUpCode.groupHeader(ms, text, selectable)
					if(selectable) {
						const elId = ms.domElementIds.listItemPrefix + text
						window.requestAnimationFrame(() => this.#$(elId).onclick = (ev) => {
							this.#onListItemClick(text, text)
							ev.stopPropagation()	// don't close dropdown list
						})
					}
				}

				this.#_orderedItems.push(val)

				if(this.#_isMultiselect) {
					this.#$(ms.domElementIds.list).innerHTML += MarkUpCode.multiSelectItem(ms, this.#stringHash(key), val, this.#_hasFavoriteStar, this.#_fractions)
				} else {
					this.#$(ms.domElementIds.list).innerHTML += MarkUpCode.singleSelectItem(ms, this.#stringHash(key), val)
				}

				const elId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
				window.requestAnimationFrame(() => this.#$(elId).onclick = (ev) => {
					if( ev.target.hasAttribute("favstar") ) {
						this.#setFavorite(key)
					} else {
						this.#onListItemClick(key, val)
					}
					if(this.#_isMultiselect) {
						ev.stopPropagation()	// don't close dropdown list
					}
				})
				window.requestAnimationFrame(() => this.#$(elId).onkeydown = (e) => {
					if(e.keyCode==13) {
						this.#onListItemClick(key, val)
					}
				})

				if(this.#_selected.size === 0) {	// initially (1st element)
					if( this.#_hasFavoriteStar ) {
						this.#_currentFavStar = key
						this.#setFavorite(key)
					}
					this.#selectOne(key, val)
					this.#invokeCallback(key, val)
				}

			}
		} else {
			throw Error("ecl-like-select-x: empty input")
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

	#selectOne(key, val) {
		const elId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		const el = this.#$(elId)
		if( !el.hasAttribute("isCollectable") ) {	this.#_selected.clear() }		// max 1
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
		const currentElId = ms.domElementIds.listItemPrefix + this.#stringHash(this.#_currentFavStar)
		const newElId = ms.domElementIds.listItemPrefix + this.#stringHash(key)
		this.#$(currentElId).querySelector("div [favstar]").textContent="-"
		this.#$(newElId).querySelector("div [favstar]").textContent="*"
		this.#_currentFavStar=key
	}

	#getClearButtonHtml() {
		const uniquePrefix = Math.floor(Math.random() * 10000)
		const id = uniquePrefix+"clearButton"
		// can't use fontawesome or similar because shadow DOM...
		const retVal = MarkUpCode.clearButton(id)
		return [id, retVal]
	}

	#updateHeadBoxContent() {
		const selectedCount = this.#_isMultiselect ? this.#_selected.size : null
		const html = MarkUpCode.headBoxContent(Array.from(this.#_selected.values()).join(), selectedCount)
		this.#$(ms.domElementIds.headBoxContent).innerHTML = html
	}

	#onListItemClick(key, val, invokeCallback=true) {
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
					that.#_selected.delete(key)
					//that.#$(elId).firstElementChild.firstElementChild.firstElementChild.removeAttribute("checked")
					that.#setChecked(that.#$(elId), false)
					action()
				} else {
					// nop (at least 1 has to be selected at all times)
				}
			} else {
				if(that.#_onSelect && that.#_onSelect(key,val)===false) {return} 
				that.#selectOne(key, val)
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
			const elId = ms.domElementIds.listItemPrefix + key
			const selectionChanged = key !== that.#_selected.keys().next().value
			if(selectionChanged) {
				that.#selectOne(key,val)
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


}

window.customElements.define('ecl-like-select-x', Element)

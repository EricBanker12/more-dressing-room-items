// Cosplay Module for Tera-Proxy
module.exports = function MoreDressingRoomItems(dispatch) {
	//----------
	// Constants
	//----------
	const path = require('path'),
		items = require('./items.json'),
		mounts = require('./mounts.json'),
		weapons = Object.keys(items.categories.style.weapon)
	
	// bug finding stuff
	const debug = false
	
	//----------
	// Variables
	//----------
	let gameId = false,
		templateId = false,
		race = -1,
		job = -1,
		inDressingRoom = false,
		itemList = []
	
	//----------
	// Functions
	//----------
	// convert array of item databaseId to array of Dressing Room objects
	function convertList(list) {
		let convertedList = []
		for (let item of list) {
			convertedList.push({
				type: 0,
				id: item,
				unk1: 0xFFFFFFFF,
				unk2: 0,
				unk3: 0,
				unk4: false,
				unk5: 0,
				unk6: 1,
				unk7: ""
			})
		}
		return convertedList
	}
	
	//----------
	// Hooks
	//----------
	// Log-in
	dispatch.hook('S_LOGIN',10, event => {
		// get character and player ids
		gameId = event.gameId
		templateId = event.templateId
		race = Math.floor((templateId - 10101) / 100)
		job = (templateId - 10101) % 100
		// check config and apply overwrite
		overwrites = {}
		// create items list for Dressing Room
		itemList = []
		// style weapons
		for (let item of items.categories.style.weapon[weapons[job]]) {
			if (!items.items[item].races || items.items[item].races.includes(race)) {
				if (!items.items[item].classes || items.items[item].classes.includes(job)) {
					itemList.push(item)
				}
			}
		}
		// style items
		for (let slot of ['body', 'face', 'hair', 'back', 'effect']) {
			for (let item of items.categories.style[slot]) {
				if (!items.items[item].races || items.items[item].races.includes(race)) {
					if (!items.items[item].classes || items.items[item].classes.includes(job)) {
						itemList.push(item)
					}
				}
			}
		}
		// gear items
		for (let slot of ['face', 'underwear']) {
			for (let item of items.categories.gear[slot]) {
				if (!items.items[item].races || items.items[item].races.includes(race)) {
					if (!items.items[item].classes || items.items[item].classes.includes(job)) {
						itemList.push(item)
					}
				}
			}
		}
		// mounts
		itemList = itemList.concat(Object.keys(mounts))
		if (debug) console.log('itemList', itemList.length)
		// convert format
		itemList = convertList(itemList)
	})
	
	// Dressing Room item tooltip
	dispatch.hook('C_REQUEST_NONDB_ITEM_INFO', 1, event => {
		if (debug) console.log('C_REQUEST_NONDB_ITEM_INFO')
		// if in Dressing Room
		if (inDressingRoom) {
			itemLast = event.item
			updateMouse = true
			// send fake reply
			dispatch.toClient('S_REPLY_NONDB_ITEM_INFO', 1, {
				item: event.item,
				unk: true,
				unk1: false,
				unk2: 0,
				unk3: 0,
				unk4: 0,
				unk5: 0,
				unk6: 0,
				unk7: 0xffffffff
			})
			return false
		}
	})
	
	// in Dressing Room
	dispatch.hook('S_REQUEST_CONTRACT', 1, event => {
		if (debug) console.log('S_REQUEST_CONTRACT', JSON.stringify(event))
		if (Number(event.type) == 76) {
			inDressingRoom = true
			// S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST
			dispatch.toClient('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 1, {
				list: itemList
			})
		}
		if (debug) console.log('inDressingRoom', inDressingRoom)
	})
	
	// block server item list
	dispatch.hook('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 'raw', () => {
		return false
	})
	
	// exit Dressing Room
	dispatch.hook('S_CANCEL_CONTRACT', 1, event => {
		if (debug) console.log('S_CANCEL_CONTRACT', JSON.stringify(event))
		if (Number(event.type) == 76) {
			inDressingRoom = false
		}
		if (debug) console.log('inDressingRoom', inDressingRoom)
	})
}

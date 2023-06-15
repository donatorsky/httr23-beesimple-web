/**
 * @typedef Chat
 * @type {object}
 * @property {number} id - chat ID.
 * @property {string} status - chat status (WAITING, READY).
 */

/**
 * @typedef Message
 * @type {object}
 * @property {string} contents - message contents.
 */

/**
 * @returns {Promise<Chat[]>}
 */
export function GetAllChats() {
	return fetch(
		'http://localhost:3000/chats',
		{
			method: 'GET',
		},
	)
		.then(assertResponseStatus(200, 'Failed to get all chats'))
		.then(logResponseData('Get all chats'))
		.catch(logFailure);
}

/**
 * @param {Chat} chat
 * @returns {Promise<{id:number} | null>}
 */
export function CreateTextChat(chat) {
	return fetch(
		`http://localhost:3000/chats`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(chat),
		},
	)
		.then(assertResponseStatus(201, 'Failed to create chat'))
		.then(logResponseData('Create chat'))
		.catch(logFailure);
}

/**
 * @param {File} file
 * @returns {Promise<{id:number} | null>}
 */
export function CreatePDFChat(file) {
	const formData = new FormData();
	formData.append('file', file);

	return fetch(
		`http://localhost:3000/chats/file`,
		{
			method: 'POST',
			body: formData,
		},
	)
		.then(assertResponseStatus(201, 'Failed to create chat by file'))
		.then(logResponseData('Create chat by file'))
		.catch(logFailure);
}

/**
 * @param {number} chatId
 * @returns {Promise<Chat | null>}
 */
export function GetChatById(chatId) {
	return fetch(
		`http://localhost:3000/chats/${chatId}`,
		{
			method: 'GET',
		},
	)
		.then(assertResponseStatus(200, 'Failed to get chat by ID'))
		.then(logResponseData('Get chat by ID'))
		.catch(logFailure);
}

/**
 * @param {number} chatId
 * @returns {Promise<Message[]>}
 */
export function GetChatMessages(chatId) {
	return fetch(
		`http://localhost:3000/chats/${chatId}/messages`,
		{
			method: 'GET',
		},
	)
		.then(assertResponseStatus(200, 'Failed to get chat messages'))
		.then(logResponseData('Get chat messages'))
		.catch(logFailure);
}

/**
 * @param {number} chatId
 * @param {Message} message
 * @returns {Promise<{id:number} | null>}
 */
export function CreateChatMessage(chatId, message) {
	return fetch(
		`http://localhost:3000/chats/${chatId}/messages`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(message),
		},
	)
		.then(assertResponseStatus(201, 'Failed to create chat message'))
		.then(logResponseData('Create chat message'))
		.catch(logFailure);
}

function assertResponseStatus(status, message) {
	return res => {
		if (res.status !== status) {
			throw new Error(`${message}, response was: ${res.status}`);
		}

		return res.json();
	};
}

function logResponseData(message) {
	return json => {
		console.log(message, json);

		return json;
	};
}

function logFailure(reason) {
	console.error(reason);
}

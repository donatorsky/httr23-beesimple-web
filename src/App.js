import './App.css';
import {useEffect, useState} from 'react';
import {CreatePDFChat, CreateTextChat, GetAllChats, GetChatById, GetChatMessages} from './api';

export default function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [prompt, setPrompt] = useState('');
	const [chats, setChats] = useState([]);
	const [messages, setMessages] = useState([]);
	const [activeChat, setActiveChat] = useState(null);
	const [chatUpdateWorker, setChatUpdateWorker] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);

	useEffect(() => {
		GetAllChats()
			.then(chats => setChats(chats))
			.then(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		return () => clearInterval(chatUpdateWorker);
	}, [chatUpdateWorker]);

	useEffect(() => {
		if (activeChat === null) {
			setMessages([]);
			setChatUpdateWorker(null);

			return;
		}

		GetChatMessages(activeChat.id)
			.then(messages => {
				if (messages === null) {
					setMessages([]);

					return;
				}

				setMessages(messages);
			});

		setChatUpdateWorker(setInterval(function () {
			GetChatById(activeChat.id)
				.then(chat => {
					if (activeChat !== null && chat.status !== activeChat.status) {
						setActiveChat(chat);
					}
				});
		}, 1000));
	}, [activeChat]);

	function handleNewChat() {
		setPrompt('');
		setActiveChat(null);
	}

	function handlePrompt() {
		const p = prompt.trim();

		if (p !== '') {
			handleTextPrompt(p);

			return;
		}

		if (selectedFile !== null) {
			handleFilePrompt();
		}
	}

	function handleTextPrompt(p) {
		setIsLoading(true);
		setPrompt('');

		CreateTextChat({
			title: p,
		})
			.then((chat) => GetChatById(chat.id))
			.then((chat) => {
				setActiveChat(chat);
				setChats([chat, ...chats]);
			})
			.then(() => setIsLoading(false))
			.catch(() => {
				console.error(...arguments);
				alert('Failed to save new chat');

				setActiveChat(null);
				setIsLoading(false);
			});
	}

	function handleFilePrompt() {
		setIsLoading(true);
		setPrompt('');

		switch (selectedFile.type) {
			case 'application/pdf':
				break;

			default:
				alert(`Unsupported file type: ${selectedFile.type}`);

				setSelectedFile(null);

				return;
		}

		CreatePDFChat(selectedFile)
			.then((chat) => GetChatById(chat.id))
			.then((chat) => {
				setActiveChat(chat);
				setChats([chat, ...chats]);
			})
			.then(() => setIsLoading(false))
			.catch(() => {
				console.error(...arguments);
				alert('Failed to save new chat');

				setActiveChat(null);
				setIsLoading(false);
			});
	}

	function loadChat(id) {
		setIsLoading(true);

		GetChatById(id)
			.then(chat => {
				if (chat === null) {
					setActiveChat(null);

					return;
				}

				setActiveChat(chat);
				setPrompt(chat);
			})
			.then(() => GetChatMessages(id))
			.then(messages => {
				if (messages === null) {
					setMessages([]);

					return;
				}

				setMessages(messages);
			})
			.then(() => setIsLoading(false));
	}

	function handleFileChange(event) {
		setSelectedFile(event.target.files[0]);

		console.log(event.target.files[0]);
	}

	function removeFile() {
		setSelectedFile(null);
	}

	return (
		<div className="App">
			<ol className={`nav ${isLoading ? 'is-loading' : ''}`}>
				<li onClick={handleNewChat}>New chat</li>
				{chats.map((chat) => <li
					key={chat.id}
					onClick={() => loadChat(chat.id)}
					style={{fontWeight: chat.id === activeChat?.id ? 'bold' : 'normal'}}
				>{chat.title}</li>)}
			</ol>

			<div className={`chat ${isLoading ? 'is-loading' : ''}`}>
				<ul>
					<li style={{display: activeChat?.status === 'WAITING' ? 'inline-block' : 'none'}}>The response is being generated</li>
					{messages.map((message) => <li
						key={message.id}
					>{JSON.stringify(message)}</li>)}
				</ul>

				<div style={{display: messages.length > 0 ? 'none' : 'block'}}>
					<h1>Let's get started</h1>
					<h2>Type or paste text</h2>
					<textarea
						value={prompt}
						onChange={e => setPrompt(e.target.value)}
						disabled={isLoading || selectedFile !== null}
						cols="30"
						rows="10"
						placeholder="Type or paste text you want to simplify..."
					></textarea>

					<h2>or upload a PDF file</h2>
					<input type="file" accept=".pdf,.jpg,.jpeg" onChange={handleFileChange} style={{display: selectedFile === null ? 'inline' : 'none'}}/>
					<div style={{display: selectedFile !== null ? 'block' : 'none'}}>
						{selectedFile?.name}<br/>
						{selectedFile?.size} B * 0% uploaded<br/>
						<button onClick={removeFile}>X</button>
					</div>

					<br/>
					<input type="button" value="Proceed" onClick={handlePrompt} disabled={isLoading}/>
				</div>

				<div style={{display: messages.length > 0 ? 'block' : 'none'}}>
					<input type="text" placeholder="Send a message" disabled={activeChat?.status !== 'READY'}/>
					<input type="button" value="|>" disabled={activeChat?.status !== 'READY'}/>
				</div>
			</div>
		</div>
	);
};


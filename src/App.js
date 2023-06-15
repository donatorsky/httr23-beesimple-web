import './App.css';
import {useEffect, useState} from 'react';
import {CreateChatMessage, CreatePDFChat, CreateTextChat, GetAllChats, GetChatById, GetChatMessages} from './api';

export default function App() {
	const [fontSize, setFontSize] = useState('1em');
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

	function handleNewChatMessage(event) {
		event.preventDefault();

		const prompt = event.target.elements.prompt.value.trim();

		if (prompt === '') {
			return false;
		}

		setIsLoading(true);

		console.log(prompt);

		CreateChatMessage(activeChat.id, {contents: prompt})
			.then(() => {
				event.target.elements.prompt.value = '';

				setIsLoading(false);
			})
			.catch(() => {
				console.error(...arguments);
				alert('Failed to save new chat');

				setActiveChat(null);
				setIsLoading(false);
			});

		return false;
	}

	function formatSize(size) {
		if (size === null) {
			return '';
		}

		if (size < 1024) {
			return `${size} B`;
		}

		size /= 1024;
		if (size < 1024) {
			return `${Math.round(size * 10) / 10} KiB`;
		}

		return `${Math.round(size * 10 / 1024) / 10} MiB`;
	}

	return (
		<div className="App d-flex align-items-stretch page" style={{fontSize: fontSize}}>
			<div className="page-row p-0" style={{flex: '0 0 337px'}}>
				<div className="chats-menu m-0 mt-3">
					<h3 className="text-center py-4">
						<span className="material-symbols-outlined">autopay</span>
						<span className="align-top bold"> BeeSimple</span>
					</h3>

					<div className="list-group mb-4">
						<div className="text-white-50 mx-3">Today</div>
						{chats.map((chat) => <button
							key={chat.id}
							onClick={() => loadChat(chat.id)}
							className={`list-group-item list-group-item-action text-truncate ${isLoading ? 'disabled' : ''} ${chat.id === activeChat?.id ? 'active' : ''}`}
							aria-current="true"
						>
							<span className={`material-symbols-outlined align-middle me-1 ${chat.type === 'PDF' ? '' : 'd-none'}`}>upload</span>
							<span className={`material-symbols-outlined align-middle me-1 ${chat.type === 'TEXT' ? '' : 'd-none'}`}>chat_bubble</span>
							{chat.title}
						</button>)}
					</div>

					<hr/>

					<button type="button" className="btn btn-dark w-100"><span className="material-symbols-outlined">account_circle</span><span className="align-top"> Set up an account</span></button>
					<p className="px-3 pb-3 text-secondary text-center">When account is set, we will be able to save your files history</p>
				</div>
			</div>

			<div className="page-row w-100">
				<nav className="navbar sticky-top bg-body-tertiary">
					<div className="d-flex justify-content-between w-100">
						<div>
							<button className={`btn btn-outline-secondary ${activeChat !== null ? '' : 'd-none'}`} onClick={handleNewChat}>+ New request</button>
						</div>
						<div>
							<button type="button" className="btn btn-outline-secondary button-margin color4 me-2">
								<span className="material-symbols-outlined align-middle">download</span>
								<span className="align-top">Download</span>
							</button>

							<div className="btn-group me-2" role="group">
								<button
									type="button"
									className={`btn btn-outline-secondary ${fontSize === '1em' ? 'active' : ''}`}
									onClick={() => setFontSize('1em')}
								>
									A
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${fontSize === '1.15em' ? 'active' : ''}`}
									onClick={() => setFontSize('1.15em')}
								>
									A+
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${fontSize === '1.35em' ? 'active' : ''}`}
									onClick={() => setFontSize('1.35em')}
								>
									A++
								</button>
							</div>

							<button
								type="button"
								className={`btn btn-outline-secondary me-2 ${fontSize === '1em' ? 'active' : ''}`}
								onClick={() => setFontSize('1em')}
							>A
							</button>
							<button
								type="button"
								className={`btn btn-outline-secondary me-2 ${fontSize === '1.15em' ? 'active' : ''}`}
								onClick={() => setFontSize('1.15em')}
							>A +
							</button>
							<button
								type="button"
								className={`btn btn-outline-secondary me-2 ${fontSize === '1.35em' ? 'active' : ''}`}
								onClick={() => setFontSize('1.35em')}
							>A + +
							</button>
							<button
								type="button"
								className="btn btn-outline-secondary me-2">
								<span className="material-symbols-outlined align-middle">contrast</span>
								<span className="align-top"> Contrast version</span>
							</button>

							<div className="btn-group">
								<button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
									ENG
								</button>
								<ul className="dropdown-menu">
									<li><button className="dropdown-item">ENG</button></li>
									<li><button className="dropdown-item">GER</button></li>
								</ul>
							</div>
						</div>
					</div>
				</nav>

				<div className={`${activeChat !== null ? 'p-2' : 'm-5'}`}>
					<ul>
						<li style={{display: activeChat?.status === 'WAITING' ? 'inline-block' : 'none'}}>The response is being generated</li>
						{messages.map((message) => <li
							key={message.id}
						>{JSON.stringify(message)}</li>)}
					</ul>

					<div style={{display: messages.length > 0 ? 'none' : 'block'}}>
						<h1 className="fw-bold">Let's get started</h1>
						<p className="fw-bold mt-3">Type or paste text</p>
						<div className="position-relative">
									<span className="badge bg-secondary position-absolute bottom-0 end-0">
										{prompt.length}/4000
									</span>
							<textarea
								value={prompt}
								onChange={e => setPrompt(e.target.value)}
								disabled={isLoading || selectedFile !== null}
								className="form-control mr-5"
								rows="10"
								maxLength="4000"
								placeholder="Type or paste text you want to simplify..."
							></textarea>
						</div>

						<p className="fw-bold mt-3">or upload a PDF file</p>
						<input
							type="file"
							accept=".pdf,.jpg,.jpeg"
							onChange={handleFileChange}
							disabled={isLoading || prompt !== ''}
							className={`form-control ${selectedFile === null ? 'd-inline' : 'd-none'}`}
						/>
						<div className={`card mb-3 ${selectedFile !== null ? 'd-block' : 'd-none'}`}>
							<div className="d-flex flex-row align-items-center">
								<div className="ms-3">
									<span className="material-symbols-outlined" style={{fontSize: '3em'}}>description</span>
								</div>
								<div>
									<div className="card-body">
										<h5 className="card-title">{selectedFile?.name}</h5>
										<p className="card-text"><small className="text-body-secondary">{formatSize(selectedFile?.size)}</small></p>
									</div>
								</div>
								<div className="flex-fill align-self-baseline">
									<button type="button" className="btn-close float-end m-3" onClick={removeFile}></button>
								</div>
							</div>
						</div>

						<input
							type="button"
							value="Proceed"
							onClick={handlePrompt}
							disabled={isLoading || (prompt === '' && selectedFile === null)}
							className="btn btn-dark mt-3 py-3 w-100"
						/>
					</div>

					<form className="sticky-bottom bg-white py-1" onSubmit={handleNewChatMessage}>
						<div className={`input-group my-2 ${messages.length > 0 ? '' : 'd-none'}`}>
							<input name="prompt" type="text" className="form-control" placeholder="Send a message" disabled={activeChat?.status !== 'READY'}/>
							<button className="btn btn-outline-secondary" type="submit" disabled={activeChat?.status !== 'READY'}>
								<span className="material-symbols-outlined align-middle">send</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};


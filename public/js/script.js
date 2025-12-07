// Set options for date formatting
const options = {
	timeZone: "Asia/Kolkata", // Set timezone to Indian Standard Time (IST)
	// weekday: "long", // Display full name of the weekday
	year: "numeric", // Display the year
	// month: "long", // Display full name of the month
	month: "numeric", // Display no. of the month
	day: "numeric", // Display the day of the month
	hour: "numeric", // Display the hour (24-hour format)
	minute: "numeric", // Display the minute
	second: "numeric", // Display the second
};

const cache = {};

let user = {};

// Use base path for Socket.IO connection
// When BASE_PATH is '/', use default Socket.IO path
// When BASE_PATH is '/rtcs' or '/real-time_commenting-system', use that as prefix
let socket;
if (window.BASE_PATH && window.BASE_PATH !== '/') {
    socket = io({
        path: window.BASE_PATH + '/socket.io'
    });
} else {
    // Default Socket.IO connection for local development
    socket = io();
}

window.onload = () => {
	setTimeout(() => {
		do {
			user.name = prompt("Enter your name");
		} while (!user.name);
		document.querySelector("#if-logged-in").style.display = "block";
		// console.log(window.DEBUG);
		if ([undefined, null, false].includes(window?.DEBUG)) {
			Object.defineProperty(user, "name", {
				writable: false,
				configurable: false
			});
		}
		socket.emit("connectionEstablised", user); // * NOTE: connection is established when socker = io() is executed!
	}, 5);
};

window.onbeforeunload = (event) => {
	// event.preventDefault();
	let data = {
		user,
		event
	}
	// console.log(data);
	socket.emit("userLeaving", data);
    // event.returnValue = 'Are you sure you want to leave this page?'; // Some browsers require a return value for the prompt to appear
}


function broadcastComment(data) {
	socket.emit("comment", data);
}

socket.on("comment", (data) => {
	addCommentToDOM(data);
})

socket.on("userJoined", (data) => {
	appendUserInfoToDOM(data, " has joined.");
})

socket.on("userLeft", (data) => {
	appendUserInfoToDOM(data, " has left.");
})

socket.on("userTyping", (user) => {
	// console.log("Typing Event:");
	// console.dir(user);
	document.querySelector("#user-typing").textContent = `${user} is typing`;
	document.querySelector(".ellipsis").style.display = "inline-block";
	debounce(() => {
		document.querySelector("#user-typing").textContent = ``;
		document.querySelector(".ellipsis").style.display = "none";
	}, 1000);
});

let timerId = null;
function debounce(func, delay) {
	if (timerId) {
		clearTimeout(timerId);
	}
	timerId = setTimeout(func, delay);
}

function typing(event) {
	// TODO: To use Throttle
	// console.log("User Typing: ", user);
	socket.emit("userTyping", user);
}

function appendUserInfoToDOM(user, action) {
	if (user && action) {
		const userNode = document.getElementById("skeleton-user").cloneNode(true);
		// console.log(commentNode);
		userNode.querySelector("#user-name").textContent = user?.name;
		userNode.querySelector("#user-action").textContent = action;
		userNode.style.display = "block";
		let parentElement = document.getElementById("comments");
		// Get the first child element of the parent element
		let firstChild = parentElement.firstChild;
		// Insert commentNode before the first child element
		parentElement.insertBefore(userNode, firstChild);
		navigator.vibrate(200);
	}
}

function colorGenerator(user) {
	const colorList = "0123456789ABCDEF";
	let color = "#";
	// console.log(`colorList: ${colorList} (${colorList.length})`);
	if (cache.hasOwnProperty(user)) {
		return cache[user];
	}
	for (let i = 0; i < 6; ++i) {
		let random = Math.random() * colorList.length;
		// console.log(`${random}`);
		color += colorList.charAt(random);
	}
	// console.log(`Choosen Color: ${color}`);
	cache[user] = color;
	return color;
}

function addCommentToDOM(comment, currentTimeStamp = Date.now()) {
	const commentNode = document.getElementById("skeleton-comment").cloneNode(true);
	commentNode.id = comment.id;
	// console.log(commentNode);
	commentNode.querySelector("#comment-msg").textContent = comment?.message;
	commentNode.querySelector("#comment-timestamp").textContent = moment(currentTimeStamp).format('LTS') //or use ISTDateString;
	commentNode.querySelector("#commenter-name").textContent = getCommentorName(comment?.user);
	commentNode.querySelector(".commenter").style.backgroundColor = colorGenerator(comment?.user);
	commentNode.querySelector(".commenter").textContent = getDisplayName(comment?.user);
	commentNode.querySelector("#reply-form").id = `reply-form-${comment?.id}`;
	let parentElement = document.getElementById("comments");
	// Get the first child element of the parent element
	let firstChild = parentElement.firstChild;
	// Insert commentNode before the first child element
	parentElement.insertBefore(commentNode, firstChild);
	navigator.vibrate(200);
}

function postComment(event) {
	let data = {}
	event.preventDefault();
	// Get current date and time
	const currentDate = new Date();
	// Format the date and time as per the options
	const ISTDateString = currentDate.toLocaleString("en-IN", options);
	let form = event.target;
	// console.log(event);
	// console.log(form);
	let formData = new FormData(form);
	let formId = form.id;
	let commentMessage = formData.get("comment");
	if (commentMessage.length === 0) { 
		return;
	}
	// console.log(commentMessage);
	const uuid = generateUUID();	
	document.getElementById("input-comment").value = "";
	data.id = uuid;
	data.message = commentMessage;
	data.user = user.name;
	data.postTime = currentDate.toString();
	// console.log(data);
	// DOM Update
	addCommentToDOM(data, currentDate);
	// Brodcast Comment
	broadcastComment(data);
}

function createCommentInput(event) {
	// console.log(event);
	// console.log(event.submitter.id);
	// console.log(event.target.id);
	event.preventDefault();
	const commentNode = document.getElementById("skeleton-comment-input").cloneNode(true);
	let form = event.target;
	let formId = form.id;
	formId = formId.replace("reply-form-", "");
	const uuid = generateUUID();
	commentNode.id = uuid;
	// let parentElement = document.getElementById(formId);
	// // Get the first child element of the parent element
	// let firstChild = parentElement.firstChild;
	// // Insert commentNode before the first child element
	// parentElement.appendChild(commentNode);
	document.getElementById("input-comment").value = "";
}

function generateUUID() {
	const crypto = window.crypto || window.msCrypto; // for IE 11 compatibility

	if (!crypto) {
		console.error("Crypto API not available.");
		return null;
	}
	
	const array = new Uint16Array(8);
	crypto.getRandomValues(array);
	
	return pad4(array[0]) + pad4(array[1]) + "-" + pad4(array[2]) + "-" + pad4(array[3]) + "-" + pad4(array[4]) + "-" + pad4(array[5]) + pad4(array[6]) + pad4(array[7]);
}

function pad4(num) {
	let ret = num.toString(16);
	while (ret.length < 4) {
		ret = "0" + ret;
	}
	return ret;
}

function getDisplayName(user) {
	return user.toUpperCase().split(" ").reduce(
		(initial, name) => initial + name.charAt(0), ""
	).slice(0,2);
}

function getCommentorName(user) {
	let arr = user.toLowerCase().split(" ");
	let name = arr[0].charAt(0).toUpperCase() + arr[0].slice(1);
	if (arr.length > 1) {
		name += " " + arr[1].charAt(0).toUpperCase() + ".";
	}
	return name.slice(0, 10);
}

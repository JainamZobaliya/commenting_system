const express = require("express");
const app = express();

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});

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

let io = require("socket.io")(server);

io.on("connection", (socket) => {
    console.log(`New Connection Established: ${socket.id}`);

    // Receive event
    socket.on('comment', (data) => {
        console.log(`Comment Received:`);
        console.dir(data);
        const time = new Date();
        // const ISTDateString = currentDate.toLocaleString("en-IN", options);
        data.serverReceivedTime = time.toString();
        console.dir(data);
        socket.broadcast.emit("comment", data);
    })

    socket.on("connectionEstablised", (user) => {
        console.log(`Connection Establised With ${user.name}`);
        socket.broadcast.emit("userJoined", user);
    })

    socket.on("userLeaving", (data) => {
		console.log("Someone is disconnecting...");
        console.dir(data);
        let leftUser = data?.user || { name: "Someone" };
        console.log("left msg: ", leftUser);
        socket.broadcast.emit("userLeft", leftUser);
    });
    
    socket.on("userTyping",  (data) => {
		console.log("Someone is typing...");
        console.dir(data);
        let typer = data?.name || { name: "Someone" };
        socket.broadcast.emit("userTyping", typer);
    });

})

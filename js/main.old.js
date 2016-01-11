function getURLparams() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var token,
    storage = localStorage,
    clientId = "tp6v9z4o11ntq2wa52fr3ricla6yc0k",
    ip = "ws://192.16.64.145:80",
    //ip = "ws://'192.16.64.206:80",
    nick = null,
    auth = "oauth:",
    users = {},
    emoticons = {},
    user = {},
    clock,
    colors = {
        "Blue": {
            name: "Blue",
            hex: "#0000FF"
        },
        "BlueViolet": {
            name: "BlueViolet",
            hex: "#8A2BE2"
        },
        "CadetBlue": {
            name: "CadetBlue",
            hex: "#5F9EA0"
        },
        "Chocolate": {
            name: "Chocolate",
            hex: "#5F9EA0"
        },
        "Coral": {
            name: "Coral",
            hex: "#FF7F50"
        },
        "DodgerBlue": {
            name: "DodgerBlue",
            hex: "#1E90FF"
        },
        "Firebrick": {
            name: "Firebrick",
            hex: "#B22222"
        },
        "GoldenRod": {
            name: "GoldenRod",
            hex: "#DAA520"
        },
        "Green": {
            name: "Green",
            hex: "#DAA520"
        },
        "HotPink": {
            name: "HotPink",
            hex: "#FF69B4"
        },
        "OrangeRed": {
            name: "OrangeRed",
            hex: "#FF4500"
        },
        "Red": {
            name: "Red",
            hex: "#0000FF"
        },
        "SeaGreen": {
            name: "SeaGreen",
            hex: "#2E8B57"
        },
        "SpringGreen": {
            name: "SpringGreen",
            hex: "#00FF7F"
        },
        "YellowGreen": {
            name: "YellowGreen",
            hex: "#9ACD32"
        }
    };

if (typeof getURLparams().ch !== "undefined" && getURLparams().ch !== "") {
    storage.channel = getURLparams().ch;
} else if(!storage.channel || typeof storage.channel === "undefined") {
    storage.channel = "jolle007";
}

$(document).ready(function() {
    Twitch.init({clientId: clientId}, function(error, status) {
        if (status.authenticated) {
            history.pushState(null, "Twitch chat", "/twitchchat/");

            token = status.token;
            auth += token;

            Twitch.api({method: "user"}, function(error, data) {
                nick = data.name;
                user = data;
            });

            $.ajax({
                url: "https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=0",
                success: function(data) {
                    $.each(data.emoticon_sets["0"], function(current, emoticon) {
                        var newEmoticon = {};
                            newEmoticon.id = emoticon.id;
                            newEmoticon.regex = emoticon.code;
                            newEmoticon.image = "//static-cdn.jtvnw.net/emoticons/v1/" + emoticon.id + "/1.0";
                        emoticons[emoticon.code] = newEmoticon;
                    });
                }
            });

            if (error === null) {
                doConnect();
                $(".intro").hide();
                $(".chat").show();
                $(".sendMessage").removeClass("hidden").removeClass("slideOutDown").addClass("slideInUp");
            } else {
                $(".intro").addClass("zoomIn");
            }
        } else {
            $(".intro").addClass("zoomIn");
        }
    });

    $(".twitch-connect").on("click", function(event) {
        Twitch.login({
            redirect_uri: "http://localhost:7000/twitchchat",
            scope: ["user_read", "chat_login"]
        });
    });

    $(".channel").text(storage.channel);
    clock = setInterval(function() {
        $(".timeNow").text(moment().format("hh:mm:ss A"));
    }, 500);

    $(".inputArea").on("keyup", function(event) {
        key = event.which || event.keyCode;
        if (key === 13 && !event.shiftKey) {
            event.preventDefault();
            message($(this).val());
            $(this).val("");
        }
    });

    $(".sendButton").on("click", function(event) {
        message($(".inputArea").val());
        $(".inputArea").val("");
    });
});

function printToChat(data) {
    //console.debug(data);
    if (data.message !== "undefined" && typeof data.message !== "undefined") {
        var type = "";

        if (data.type !== "undefined") {
            if (data.type === 1) {
                type = '<img src="img/broadcaster.png" class="badge"> ';
            } if (data.type === 2) {
                type = '<img src="img/mod.png" class="badge"> ';
            } else if (data.type === 3) {
                type = '<img src="img/admin.png" class="badge"> ';
            } else if (data.type === 4) {
                type = '<img src="img/staff.png" class="badge"> ';
            } else if (data.type === 5) {
                type = '<img src="img/global_mod.png" class="badge"> ';
            }
        }

        msg = "";
        messageInWords = data.message.split(" ");
        meCommand = false;

        $.each(messageInWords, function(current) {
            var word_uri = encodeURI(messageInWords[current]);
                word = word_uri.replace("%E2%86%B5", "").replace("%0D%0A", "").replace("%01ACTION", "").replace("%01", "");
                word = decodeURI(word);

            //Emoticons
            if (typeof emoticons[word] === "object") {
                word = '<img src="' + emoticons[word].image + '" class="emoticon" draggable="false">';
            } else {
                $.each(emoticons, function(current, emote) {
                    var regexp = new RegExp(emote.regex);
                    if (regexp.test(word) === true) {
                        word = '<img src="' + emote.image + '" class="emoticon" draggable="false">';
                        return;
                    }
                });
            }

            //Highligt a username if metioned
            usernameAsMention = "@" + user.name;
            displayNameAsMention = "@" + user.display_name;
            if (word.includes(usernameAsMention) === true) {
                otherChars = word.split(usernameAsMention);

                word = '<span class="mentioning">' + usernameAsMention + '</span>';
                $.each(otherChars, function(current, char) {
                    word += char;
                });
            } else if (word.includes(displayNameAsMention) === true) {
                otherChars = word.split(displayNameAsMention);

                word = '<span class="mentioning">' + displayNameAsMention + '</span>';
                $.each(otherChars, function(current, char) {
                    word += char;
                });
            }

            msg += word + " ";

            if (word_uri.indexOf("%01ACTION") > -1) {
                meCommand = true;
            }
        });

        msg = msg.substr(0,msg.length - 1);

        var output = "";
        if (data.messageType === "NOTICE") {
            if (msg === "Error logging in ") {
                doDisconnect();
            } else if (msg === "Only turbo users can specify an arbitrary hex color. Use one of the following instead: Blue, BlueViolet, CadetBlue, Chocolate, Coral, DodgerBlue, Firebrick, GoldenRod, Green, HotPink, OrangeRed, Red, SeaGreen, SpringGreen, YellowGreen.") {
                console.debug("Swapped back color");
                user.color = user.oldColor;
            }
            output = '<div class="message animated slideInLeft"><p>' + moment().format("h:mm") + ' <span style="color:' + data.color + '">' + msg + '</span></p></div></div></div>';
        } else if (data.messageType === "PRIVMSG") {
            if (meCommand) {
                output = '<div class="message animated slideInLeft"><p>' + moment().format("h:mm") + ' ' + type + '<span style="color:' + data.color + '">' + data.name + ' ' + msg + '</span></p></div></div></div>';
            } else {
                output = '<div class="message animated slideInLeft"><p>' + moment().format("h:mm") + ' ' + type + '<span style="color:' + data.color + '">' + data.name + '</span>: ' + msg + '</p></div></div></div>';
            }
        } else if (data.messageType === "COMMAND") {
            output = '<div class="message animated slideInLeft"><p>' + moment().format("h:mm") + ' ' + type + '<span style="color:' + data.color + '">' + data.name + ' ' + msg + '</span></p></div></div></div>';
        }

        if (output !== "") {
            $(".chat").append(output);
            return true;
        } else {
            return false;
        }
    }
}

function doConnect() {
	websocket = new WebSocket(ip);
	websocket.onopen = function(event) {
        onOpen(event);
    };
	websocket.onclose = function(event) {
        onClose(event);
    };
	websocket.onmessage = function(event) {
        onMessage(event);
    };
}

function onOpen(event) {
	console.debug("Connected");
    printToChat({color: "#9E9E9E", message: "Welcome to the chat room!", messageType: "NOTICE"});
	websocket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
	websocket.send('PASS ' + auth);
	websocket.send('NICK ' + nick);
	websocket.send('JOIN #' + storage.channel);
  }

function onMessage(event) {
	var post = stripString(event.data);
	if (post !== undefined && post.username !== user.display_name) {
        if (post.messageType === "PRIVMSG") {
            if (users.hasOwnProperty(post.username) === false) {
                var newUser = {};
                    newUser.name = post.username.toLowerCase();
                    newUser.display_name = post.username;
                    newUser.last_spoke = moment().format("YYYY-MM-DD HH:mm:ss:SS");
                users[post.username] = newUser;
            } else {
                users[post.username].last_spoke = moment().format("YYYY-MM-DD HH:mm:ss:SS");
            }

            printToChat({name: post.username, color: post.color, type: post.userType, message: post.message, messageType: post.messageType});

            if (post.userType !== 0) {
    			if (post.userType === 1) {
    				console.debug("[Broadcaster] " + post.username + ": "+ post.message);
    			} else if (post.userType === 2) {
    				console.debug("[Moderator] " + post.username + ": " + post.message);
    			}
    		} else {
    			console.debug("[Program] " + post.username + ": " + post.message);
    		}
        } else {
            printToChat({color: "#9E9E9E", message: post.message, messageType: post.messageType});
        }
	} else if (post !== undefined && post.username === user.display_name) {
        user.color = post.color;
        user.oldColor = user.color;
        user.userType = post.userType;

        if (post.messageType === "PRIVMSG") {
            printToChat({name: post.username, color: user.color, type: post.userType, message: post.message, messageType: post.messageType});
        } else {
            printToChat({color: "#9E9E9E", message: post.message, messageType: post.messageType});
        }
    }

	if (event.data.indexOf('PING') > -1) {
		websocket.send('PONG :tmi.twitch.tv');
		console.debug("Sent: PONG");
	}
}

function stripString (str) {
    var post = {};
	if (str.indexOf("PRIVMSG") > -1 || str.indexOf("USERSTATE") > -1 || str.indexOf("NOTICE") > -1) {
        console.debug(str);

        post.messageType = "PRIVMSG";
        if (str.indexOf("USERSTATE") > -1) {
            post.messageType = "USERSTATE";
        } else if (str.indexOf("NOTICE") > -1) {
            post.messageType = "NOTICE";
        }

		if (str.indexOf("@color=") > -1) {
			// Color string
			clrStr = str.substr(str.indexOf("@color=")+7, str.length);
			color = clrStr.substr(0, clrStr.indexOf(";"));
			str = clrStr.substr(clrStr.indexOf(";")+1);
			if (color !== undefined) {
				post.color = color;
			}
		}
		if (str.indexOf("display-name=") > -1) {
			// Username string
			usrStr = str.substr(str.indexOf("display-name=")+13, str.length);
			str = usrStr.substr(usrStr.indexOf(";")+1, usrStr.length);
			username = usrStr.substr(0, usrStr.indexOf(";"));
			if (username !== undefined) {
				post.username = username;
			}
		}
		if (str.indexOf("user-type=") > -1) {
            // User type integer
			typeStr = str.substr(str.indexOf("user-type=")+10, str.length);
			userType = typeStr.substr(0, typeStr.indexOf(":"));
			userType = userType.replace(" ", "");
			if (username.toLowerCase() === storage.channel) {
				post.userType = 1;
			} else {
				if (userType === "") {
					post.userType = 0;
				} else if (userType === "mod") {
					post.userType = 2;
				} else if (userType === "admin") {
                    post.userType = 3;
                } else if (userType === "staff") {
                    post.userType = 4;
                } else if (userType === "global_mod") {
                    post.userType = 5;
                }
			}
		}

        /*if (str.indexOf("subscriber=") > -1) {
            // Subscriber boolean
            subsStr = str.substr(str.indexOf("subscriber=")+11, str.length);
			str = usrStr.substr(usrStr.indexOf(";")+1, subsStr.length);
			subscriber = subsStr.substr(0, subsStr.indexOf(";"));
			if (subscriber !== undefined) {
				if (subscriber === "1") {
                    post.subscriber = true;
                } else {
                    post.subscriber = false;
                }
			}
		}
        if (str.indexOf("subscriber=") > -1) {
            // Turbo boolean
            turStr = str.substr(str.indexOf("turbo=")+6, str.length);
			str = turStr.substr(usrStr.indexOf(";")+1, turStr.length);
			turbo = turStr.substr(0, turStr.indexOf(";"));
			if (turbo !== undefined) {
				if (turbo === "1") {
                    post.turbo = true;
                } else {
                    post.turbo = false;
                }
			}
		}*/

		// Message string
        msgStr = str.substr(str.indexOf(post.messageType), str.length);
		text = msgStr.substr(msgStr.indexOf(":")+1, msgStr.length);
		if (text !== undefined) {
			post.message = text;
		}

		return post;
	}
}

function onError(event) {
	console.debug(event);
	websocket.close();
}

function onClose(event) {
	console.debug(event);
    Twitch.logout();
    $(".intro").show().addClass("zoomIn");
    $(".chat").hide();
    $(".sendMessage").removeClass("slideInUp").addClass("slideOutDown");
}

function doSend(message) {
	console.debug(message);
	websocket.send(message);
}

function sendText(msg) {
	doSend(msg);
}

function doDisconnect() {
	websocket.close();
}

function message(msg) {
    if (msg.length > 0) {
        websocket.send("PRIVMSG #" + storage.channel + " :" + msg);
    	console.debug("Sent message: " + msg);

        if (msg[0] !== "/" && msg[0] !== ".") {
            return printToChat({name: user.display_name, color: user.color, type: user.userType, message: msg, messageType: "PRIVMSG"});
        } else {
            if (msg.substr(1,6) === "color ") {
                color = msg.substr(7);
                regex = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");

                if (colors.hasOwnProperty(color)) {
                    user.color = colors[color].hex;
                } else if (regex.test(color) === true) {
                    user.oldColor = user.color;
                    user.color = color;
                }
            } else if (msg.substr(1,3) === "me ") {
                return printToChat({name: user.display_name, color: user.color, type: user.userType, message: msg.substr(4), messageType: "COMMAND"});
            }
        }
    }
}

$(window).on("beforeunload", function() {
    doDisconnect();
    Twitch.logout();
});

function chromaKey() {
    $("body").css("background-color", "#000000");
    $("header").css("background-color", "#000000");
    $("footer").css("display", "none");
}

function getURLparams() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var debug = false,
    storage = localStorage,
    clientId = "tp6v9z4o11ntq2wa52fr3ricla6yc0k",
    auth = "oauth:",
    me = {},
    sent = [],
    users = {},
    chatters = 0,
    token,
    nick,
    clock,
    reader,
    sender,
    subscriber,
    colors = {
        "blue": {
            name: "Blue",
            hex: "#0000FF"
        },
        "blueviolet": {
            name: "BlueViolet",
            hex: "#8A2BE2"
        },
        "cadetblue": {
            name: "CadetBlue",
            hex: "#5F9EA0"
        },
        "chocolate": {
            name: "Chocolate",
            hex: "#5F9EA0"
        },
        "coral": {
            name: "Coral",
            hex: "#FF7F50"
        },
        "dodgerblue": {
            name: "DodgerBlue",
            hex: "#1E90FF"
        },
        "firebrick": {
            name: "Firebrick",
            hex: "#B22222"
        },
        "goldenrod": {
            name: "GoldenRod",
            hex: "#DAA520"
        },
        "green": {
            name: "Green",
            hex: "#DAA520"
        },
        "hotpink": {
            name: "HotPink",
            hex: "#FF69B4"
        },
        "orangered": {
            name: "OrangeRed",
            hex: "#FF4500"
        },
        "red": {
            name: "Red",
            hex: "#FF0000"
        },
        "SeaGreen": {
            name: "SeaGreen",
            hex: "#2E8B57"
        },
        "springgreen": {
            name: "SpringGreen",
            hex: "#00FF7F"
        },
        "yellowgreen": {
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
                me = data;

                chatSignIn(nick, auth);
            });

            Twitch.api({method: "chat/" + storage.channel + "/badges"}, function(error, data) {
                if (data.subscriber !== null) {
                    subscriber = data.subscriber.image.replace("http://", "//");
                } else {
                    subscriber = false;
                }
            });

            //Get all chatters
            getChatters(storage.channel);

            if (error === null) {
                $(".intro").hide();
                $(".chat").show();
            } else {
                $(".intro").addClass("zoomIn");
            }
        } else {
            $(".intro").addClass("zoomIn");
        }
    });

    $(".twitch-connect").on("click", function(event) {
        Twitch.login({
            redirect_uri: "https://joel.f-eri.cf/twitchchat/",
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

            msg = $(this).val();
            if (msg[msg.length - 1] === "\n") {
                msg = msg.substr(0, msg.length - 1);
            }
            msg = replaceAll(msg, "\n", " ");

            sender.say("#" + storage.channel, msg);
            sent.unshift(msg);

            $(this).val("");
        }
    });

    $(".sendButton").on("click", function(event) {
        msg = $(".inputArea").val();
        if (msg[msg.length - 1] === "\n") {
            msg = msg.substr(0, msg.length - 1);
        }
        msg = replaceAll(msg, "\n", " ");

        sender.say("#" + storage.channel, msg);
        sent.unshift(msg);

        $(".inputArea").val("");
    });
});

function getChatters(channel) {
    $.ajax({
        url: "https://tmi.twitch.tv/group/user/" + channel + "/chatters",
        crossDomain: true,
        dataType: "jsonp",
        success: function(data) {
            if (debug) console.info("Succeeded getting chatters");
            $.each(data.chatters, function(current, usertype) {
                $.each(usertype, function(current, chatter) {
                    if (!users.hasOwnProperty(chatter)) {
                        users[chatter] = {};
                        users[chatter].name = chatter;
                        users[chatter].joined = moment().format("x");
                        users[chatter].online = true;
                    }
                });

                $.each(users, function(current, user) {
                    if (usertype.hasOwnProperty(user.name) === false) {
                        user.online = false;
                        if (debug) console.warn(user);
                    }
                });
            });
        },
        error: function(error) {
            if (debug) console.error("Failed getting chatters");
            if (debug) console.error(error);
        }
    });
}

/*function getEmotes(channel) {
    var found_set = null;
    $.getJSON("https://twitchemotes.com/api_cache/v2/sets.json", function(data) {
        $.each(data.sets, function(current, set) {
            if (set === channel) {
                found_set = current;
            }
        });

        if (found_set !== null) {
            $.getJSON("https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=" + found_set, function(data) {
                console.log(data.emoticon_sets["11"]);
            });
        }
    });
}*/

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function htmlEntities(html) {
	function it() {
		return html.map(function(n, i, arr) {
				if(n.length == 1) {
					return n.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
						   return '&#'+i.charCodeAt(0)+';';
						});
				}
				return n;
			});
	}

	var isArray = Array.isArray(html);
	if(!isArray) {
		html = html.split('');
	}
	html = it(html);
	if(!isArray) html = html.join('');
	return html;
}

function formatEmotes(text, emotes) {
	var splitText = text.split("");
	for(var i in emotes) {
		var e = emotes[i];
		for(var j in e) {
			var mote = e[j];
			if(typeof mote == "string") {
				mote = mote.split("-");
				mote = [parseInt(mote[0]), parseInt(mote[1])];
				var length =  mote[1] - mote[0],
					empty = Array.apply(null, new Array(length + 1)).map(function() { return ''; });
				splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
				splitText.splice(mote[0], 1, '<img alt="emoticon" src="//static-cdn.jtvnw.net/emoticons/v1/' + i + '/1.0" draggable="false" class="emoticon">');
			}
		}
	}
	return htmlEntities(splitText).join("");
}

function toChat(type, channel, user, message, self) {
    function badgeImg(badge) {
        return '<img alt="' + badge + '" src="img/' + badge + '.png" type="image/png" draggable="false" class="badge" /> ';
    }

    badge = "";

    if (user !== null) {
        //user badges
        if (user.username == storage.channel) {
    		badge += badgeImg("broadcaster");
    	}

    	if (user['user-type']) {
    		badge += badgeImg(user['user-type']);
    	}

    	if (user.turbo) {
    		badge += badgeImg("turbo");
    	}

        if (user.subscriber && subscriber !== false) {
            badge += '<img alt="subscriber" src="' + subscriber + '" type="image/png" draggable="false" class="badge" /> ';
        }

        //User color
        if (me.color) {
            user.color = me.color;
        }

        if (user.color === null) {
    		if(!randomColorsChosen.hasOwnProperty(channel)) {
    			randomColorsChosen[channel] = {};
    		}

    		if(randomColorsChosen[channel].hasOwnProperty(name)) {
    			user.color = randomColorsChosen[channel][user.username];
    		} else {
    			user.color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    			randomColorsChosen[channel][user.username] = user.color;
    		}
    	}

        //User name
        if (user["display-name"] === null) {
            user["display-name"] = user.username;
        }
        username = '<span class="user_' + user.username + '">' + user["display-name"] + '</span>';

        /*messageInWords = message.split(" ");

        $.each(messageInWords, function(current, word) {
            usernameAsMention = "@" + user.username;
            displayNameAsMention = "@" + user["display-name"];
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

            message += word + " ";
        });

        message = message.substr(0, message.lenght - 1);*/

        message = '<span class="message_' + user.username + '">' + formatEmotes(message, user.emotes) + '</span>';
    } else {
        message = '<span class="message_system">' + message + '</span>';
    }

    if (type === "system") {
        output = '<div class="message animated slideInLeft"><p class="system"><span class="time">' + moment().format("h:mm") + '</span> ' + message + '</p></div></div></div>';
    } else if (type === "chat") {
        output = '<div class="message animated slideInLeft"><p><span class="time">' + moment().format("h:mm") + '</span> ' + badge + '<span style="color:' + user.color + '">' + username + '</span>: ' + message + '</p></div>';
    } else if (type === "action") {
        output = '<div class="message animated slideInLeft"><p><span class="time">' + moment().format("h:mm") + '</span> ' + badge + '<span style="color:' + user.color + '">' + username + ' ' + message + '</span></p></div>';
    }

    $(".chat").append(output);
    $(".chat").scrollTop($(".message:last").position().top);
}

function chatSignIn(username, password) {
    defaultColors = [
        "#0000FF",
        "#8A2BE2",
        "#5F9EA0",
        "#5F9EA0",
        "#FF7F50",
        "#1E90FF",
        "#B22222",
        "#DAA520",
        "#DAA520",
        "#FF69B4",
        "#FF4500",
        "#0000FF",
        "#2E8B57",
        "#00FF7F",
        "#9ACD32"
    ];
	randomColorsChosen = {};

    readerOptions = {
        options: {
            debug: debug
        },
        connection: {
            reconnect: true
        },
        channels: [storage.channel],
    };

    senderOptions = {
        options: {
            debug: debug
        },
        identity: {
            username: username,
            password: password
        },
        connection: {
            reconnect: true
        },
        channels: [storage.channel],
    };

    reader = new irc.client(readerOptions);
    sender = new irc.client(senderOptions);

    reader.connect();
    sender.connect();

    //Sender
    sender.on("connected", function(address, port) {
        toChat("system", null, null, "Welcome to the chat room!", false);
        $(".sendMessage").removeClass("hidden").removeClass("slideOutDown").addClass("slideInUp");
    });

    sender.on("disconnected", function (reason) {
        toChat("system", null, null, reason, false);

        $(".intro").show().addClass("zoomIn");
        $(".chat").hide();
        $(".sendMessage").removeClass("slideInUp").addClass("slideOutDown");
    });

    sender.on("ping", function () {
        sender.raw("PONG :tmi.twitch.tv");
        getChatters(storage.channel);
    });

    sender.on("notice", function (channel, msgid, message) {
        toChat("system", channel, null, message, false);
    });

    //Reader
    reader.on("chat", function(channel, user, message, self) {
        if (debug) console.debug(user);
        toChat("chat", channel, user, message, self);
    });

    reader.on("action", function (channel, user, message, self) {
        toChat("action", channel, user, message, self);
    });

    reader.on("timeout", function (channel, username) {
        $(".message_" + username).fadeOut("fast", function() {
            $(this).text("<message deleted>").addClass("deleted").fadeIn("fast");
        });
    });

    reader.on("join", function (channel, username) {
        if (!users.hasOwnProperty(username)) {
            users[username] = {};
            users[username].name = username;
            users[username].joined = moment().format("x");
            users[username].online = true;
        }
    });

    reader.on("part", function (channel, username) {
        users[username].online = false;
    });

    reader.on("ping", function () {
        reader.raw("PONG :tmi.twitch.tv");
        getChatters(storage.channel);
    });
}

$(window).on("beforeunload", function() {
    Twitch.logout();
});

function chromaKey() {
    $("body").css("background-color", "#000000");
    $("header").css("background-color", "#000000");
    $("footer").css("display", "none");
}

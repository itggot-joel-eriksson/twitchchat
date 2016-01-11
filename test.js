var clientId = "3dunf2e9px97alvbew31saifesyrnai",
    oauth_token = "oauth:",
    user = {},
    options,
    client;

$(document).ready(function() {
    Twitch.init({clientId: clientId}, function(error, status) {
        console.debug(status);

        if (status.authenticated) {
            history.pushState(null, "Twitch chat", "/twitchchat/test.html");

            $(".twitch-connect").hide();
            oauth_token += status.token;

            Twitch.api({method: "user"}, function(error, data) {
                user = data;
            });


            options = {
                options: {
                    debug: true
                },
                connection: {
                    random: "chat",
                    reconnect: true
                },
                identity: {
                    username: user.name,
                    password: "oauth:" + status.token
                },
                channels: ["#jolle007"],
            };

            client = new irc.client(options);

            // Connect the client to the server..
            client.connect();

            client.on("chat", function (channel, user, message, self) {
                console.debug(user);
            });
        }
    });

    $(".twitch-connect").on("click", function(event) {
        Twitch.login({
            redirect_uri: "http://localhost:7000/twitchchat/test.html",
            scope: ["user_read", "chat_login"]
        });
    });
});

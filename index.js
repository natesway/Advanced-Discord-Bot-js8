var fs              = require('fs');
const ms            = require('ms');
var YTDL            = require('ytdl-core');
var memes           = require('dankmemes');
const chalk         = require('chalk');
var getJSON         = require('get-json');
const Discord       = require('discord.js');
const SteamTotp     = require('steam-totp');
const GoogleImages  = require('google-images');

const configS       = require('./settingsConfig/ConfigSammy.json');
const configJ       = require('./settingsConfig/ConfigJack.json');
const configB       = require('./settingsConfig/ConfigBen.json');

var settings        = './settingsConfig/settings.json';
var file = require(settings)

require('console-stamp')(console, '[HH:MM:ss]');

const TOKEN = file.TOKEN;
const GreenStyle = chalk.green;

function play(connection, message){
    var server = servers[message.guild.id];

    const streamOptions = { volume : 0.50}
    const stream = YTDL(server.queue[0], {filter: "audioonly"});

    server.dispatcher = connection.playStream(stream, streamOptions);

    NOW_PLAYING = server.queue[0];

    server.queue.shift();

    if(server.queue[0] != undefined)
      getYTinfo(server.queue[0], function(res){
        NEXT_PLAYING = res.title;
      });
    else
      NEXT_PLAYING = "Nothing";

    server.dispatcher.on("end", function(){
        if(server.queue[0]) play(connection, message);
        else{
          connection.disconnect();
          NOW_PLAYING = "Nothing";
        }

    });
}

function getYTinfo(yturl, response) {

    let domains = ['youtu.be', 'youtube.com'];

    let key = file.YT_API;

    let id = "";

    if(yturl.indexOf(domains[0]) > 0) {
        id = yturl.substring(yturl.lastIndexOf("/") + 1 );
    }
    else if(yturl.indexOf(domains[1]) > 0) {
        let lastPos = yturl.indexOf("&") > 0 ? yturl.indexOf("&") : 0;

        if(lastPos == 0) id = yturl.substring(yturl.indexOf("v=") +2);
        else id = yturl.substring(yturl.indexOf("v=") +2, lastPos);
    }
    else {
        return "Invalid URL";
    }

    let api_url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails%2C+snippet&id=" + id + "&fields=etag%2CeventId%2Citems%2Ckind%2CnextPageToken%2CpageInfo%2CprevPageToken%2CtokenPagination%2CvisitorId&key=" + key;

    getJSON(api_url, function(err, data){
        var return_data = [];
        return_data['title'] = data.items[0].snippet.title;
        return_data['thumbnail'] = data.items[0].snippet.thumbnails.medium.url;
        return_data['channelTitle'] = data.items[0].snippet.channelTitle;
        let dur = data.items[0].contentDetails.duration;
        dur = dur.replace("PT", "");
        dur = dur.replace("H", ":");
        dur = dur.replace("M", ":");
        dur = dur.replace("S", "");
        return_data['duration'] = dur;

        response(return_data);
    });
}

var bot = new Discord.Client();
bot.commands = new Discord.Collection();

var servers = {};

fs.readdir("./commands/", (err, files) => {
  if(err) console.error(err);

  let jsfiles = files.filter(f => f.split(".").pop() === "js");
  if(jsfiles.length <= 0){
    console.log("No comannds to load!");
    return;
  }

  console.log(`Loading ${jsfiles.length} commands!`);

  jsfiles.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${i + 1}: ${f} loaded!`)
    bot.commands.set(props.help.name, props);
  });

})

bot.on("guildMemberAdd", function(member) {
  member.guild.channels.find("name", "general").send(member.toString() + " Welcome To The Comp Crew Official Server");

  member.addRole(member.guild.roles.find("name", "Members")).then(() => {
    console.log(`${message.author.username}` + " joined and has been given The Member Role");
  })
});

bot.on("ready", async () => {

  console.log(GreenStyle("----------------------------------------"));
  console.log(GreenStyle("                BOT PAGE                "));
  console.log(GreenStyle("             BOT NOW ACTIVE             "));
  console.log(GreenStyle("----------------------------------------"));
  console.log(GreenStyle("Logging Woll Now Start...               "));
  console.log(GreenStyle("----------------------------------------"));

});

bot.on("message", async message => {

  var prefix = (file.prefix[message.guild.id] == undefined) ? file.prefix["default"] : file.prefix[message.guild.id];

  if(!message.content.startsWith(prefix)) return;
  if(message.author.bot) return;

  let messageArray = message.content.split(" ");
  let command = messageArray[0];
  let args = messageArray.slice(1);
  var args1 = message.content.substring(prefix.length).split(" ");

  let cmd = bot.commands.get(command.slice(prefix.length));
  if(cmd) cmd.run(bot, message, args, prefix);

  switch(args1[0].toLowerCase()) {

    case "play":

    if (!args1[1]){
        message.channel.send(":x: " + "| Please Provide A Link (YouTube link)");
        return;
    }

    if (!message.member.voiceChannel){
        message.channel.send(":x: " + "| You Must Be In A Voice Channel!");
        return;
    }

    if(!servers[message.guild.id]) servers[message.guild.id] = {
       queue: []
    };

    var server = servers[message.guild.id];
    var ytlink = args1[1];
    var re = /(http(s)?:\/\/)?(www\.)?youtu(be|\.be)(\.com)?\/(watch\?v=)?[a-zA-Z0-9_-]{11}/gi;

    var found = ytlink.match(re);

    if(found == null){
      message.channel.send(":x: " + "| Please Enter A YouTube Link!");
    }else{
      server.queue.push(found[0]);
      if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection){

        var server = servers[message.guild.id];
        var song = server.queue.length;

        message.channel.send(":white_check_mark: " + "| Added " + song + " song to the queue!");
          play(connection, message);
       });
    }

      break;

      case "fuckoff":
                    console.log(`${message.author.username}` + " " + "Used The Command " + prefix + "fuckoff");
                    var server = servers[message.guild.id];

                    if (message.guild.voiceConnection)
                  {
                      for (var i = server.queue.length - 1; i >= 0; i--)
                      {
                          server.queue.splice(i, 1);
                   }
                      server.dispatcher.end();
                      NOW_PLAYING = "Nothing";
                      //console.log("[" + new Date().toLocaleString() + "] Stopped the queue.");
                  }
     break;

     case "prefix":
          if(message.member.hasPermission("ADMINISTRATOR")) {
            if(!args[0]){
              return message.channel.send(":x: " + "| Please Enter a prefix ¯\\_(ツ)_/¯")
            }

            var prefix_val = args[0];
            file.prefix[message.guild.id] = prefix_val;

            fs.writeFile(settings, JSON.stringify(file, null, 2), function (err) {

              message.channel.send(":white_check_mark: " + "| The NEW Prefix for this bot is: " + prefix_val);
            });

          } else {
            return message.reply(":x: " + "| You need to have the \"ADMINISTRATOR\" Permission").then(() => {
            });
          }
      break;

      case "np":

        if(!servers[message.guild.id]) servers[message.guild.id] = {
          queue: []
        };

        var server = servers[message.guild.id];

          if(server.queue[0] != undefined)
            getYTinfo(server.queue[0], function(res){
              NEXT_PLAYING = res.title;
            });
          else
            NEXT_PLAYING = "Nothing";


          if(NOW_PLAYING == "Nothing"){

            message.channel.send("Nothing is playing idiot!");

          }else{
            getYTinfo(NOW_PLAYING, function(res){

              var np = new Discord.RichEmbed()
                      .addField("Song Name: ", res.title, true)
                      .addField("Uploaded By: ", res.channelTitle, false)
                      .addField("Duration: ", res.duration, true)
                      .addField("Up Next: ", NEXT_PLAYING, false)

                      .setThumbnail(res.thumbnail)

                      .setColor("0x#FF0000")

                       message.channel.send(np)

            });
          }

      break;

      case "playlist":
          if (!message.member.voiceChannel){
              message.channel.send(":x: " + "| You Must Be In A Voice Channel!");
              return;
          }

          if(!args1[1]){
            return message.channel.send(":x: " + "| Please Enter a YouTube Playlist Url");
          }

          if(args1[1].indexOf("youtube.com") == -1){
            return message.channel.send(":x: " + "| Invalid Youtube Playlist Link!!");
          }

          var ytlink = args1[1];
          var re = /(http(s)?:\/\/)?(w{3}\.)?youtube\.com\/(watch|playlist)\?(v=|list=)[a-zA-Z0-9-_]+(&)?(list=)?[a-zA-Z0-9-_]+/gi;

          var found = ytlink.match(re);

          if(found == null)
              return message.channel.send(":x: " + "| Please Enter A YouTube Playlist Link!");

          PLAYID = found[0].substring(found[0].lastIndexOf("list=") + 5 );

          var url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + PLAYID + "&key=" + file.YT_API;

          var json = getJSON(url, function(err, data){
            var data = data.items;
            data.forEach(function(element) {
              if(!servers[message.guild.id]) servers[message.guild.id] = {
                 queue: []
              };

              var server = servers[message.guild.id];
              server.queue.push("https://www.youtube.com/watch?v=" + element.snippet.resourceId.videoId);

            }, this);
          });

          if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection){
              var server = servers[message.guild.id];
              var songs = server.queue.length;

              message.channel.send(":white_check_mark: " + "| Added " + songs + " songs to the queue!");
              play(connection, message);
           });
          break;

  case "stop":
          var server = servers[message.guild.id];

          if (message.guild.voiceConnection)
        {
            for (var i = server.queue.length - 1; i >= 0; i--)
            {
                server.queue.splice(i, 1);
          }
            server.dispatcher.end();
            NOW_PLAYING = "Nothing";
            //console.log("[" + new Date().toLocaleString() + "] Stopped the queue.");
        }
          break;

   case "skip":
          var server = servers[message.guild.id];

          try {
            if (server.dispatcher) {
              server.dispatcher.end();
            }else{
              return message.channel.send(":x: " + "| Cannot Do that!");
            }
          } catch(e) {
           NOW_PLAYING = "Nothing";
           return message.channel.send(":x: " + "| Noting To skip my man");
          }

          break;



  }
});

bot.login(TOKEN);

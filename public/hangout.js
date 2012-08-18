//Hangout.js
var Hangout=(function(){
  //private variable to hold videos
  var videos = [],room='';
  //This will include all the rtc stuff
  //once this is called, it will attach to all required events.
  //here
  //Initialize hangouts, returns false if we are not in a chatroom
  function __init() {
    room = window.location.hash.slice(1);
    //if you are not in a chatroom, return
    if(room.length===0)
      return false;

    //We are in a chatRoom
    //Let's remove the chatbutton
    $('#newRoom').remove();
    if(PeerConnection){
      rtc.createStream({"video": true, "audio": true}, function(stream) {
        //debugger;
        $('#you').attr('src',URL.createObjectURL(stream));
        videos.push($('#you')[0]);
        rtc.attachStream(stream, 'you');
        subdivideVideos();
        window.onresize=subdivideVideos;
      });
    }else {
      return false;
    }
    
    rtc.connect("ws://"+window.location.hostname+":8000/", room);

    rtc.on('add remote stream', function(stream, socketId) {
      console.log("ADDING REMOTE STREAM...");
      var clone = cloneVideo('you', socketId);
      $("#"+clone.id).attr("class", "");
      rtc.attachStream(stream, clone.id);
      subdivideVideos();
    });
    rtc.on('disconnect stream', function(data) {
        console.log('remove ' + data);
        removeVideo(data);
    });
    rtc.on('receive_chat_msg', function(data){
      UI.addChatMessage(data.msg);
    })
  };
  function removeVideo(socketId) {
    var video = $('remote' + socketId)[0];
    if (video) {
      videos.splice(videos.indexOf(video), 1);
      video.parentNode.removeChild(video);
    }
  }
  function getNumPerRow() {
    var len = videos.length;
    var biggest;

    // Ensure length is even for better division.
    if (len % 2 === 1) {
      len++;
    }

    biggest = Math.ceil(Math.sqrt(len));
    while (len % biggest !== 0) {
      biggest++;
    }
    return biggest;
  }

  function subdivideVideos() {
    if(UI.getMode()==='theater'){
      //let us only show the first video for now
      for (var i = 0, len = videos.length; i < len; i++) {
        var video = videos[i];
        $(video).hide();
      }
     }
    else{
      $('#videos video').show();
      //show all the videos
      var perRow = getNumPerRow();
      var numInRow = 0;
      for (var i = 0, len = videos.length; i < len; i++) {
        var video = videos[i];
        setWH(video, i);
        numInRow = (numInRow + 1) % perRow;
      }
    }
  }

  function setWH(video, i) {
  }

  function cloneVideo(domId, socketId) {
    var video = $("#"+domId)[0];
    var clone = video.cloneNode(false);
    clone.id = "remote" + socketId;
    $('#videos').append(clone);
    videos.push(clone);
    return clone;
  }

  function sendChat(message){
    rtc._socket.send(JSON.stringify({
      eventName:"chat_msg",
      data:{
        msg:message,
        room:room
      }
    }),function(err){
      console.log(err);
    });
  };
  return {
    enterRoom:null,
    leaveRoom:null,
    changeView:null,
    init:__init,
    chat:sendChat
  };
})();
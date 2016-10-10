"use strict"

window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

var AudioHandler = (() => {
    var constraints = deviceId => ({
            audio:{
                optional:[{sourceId: deviceId}]
            }
        }),
        getStream = x => new Promise((s,r) => navigator.getUserMedia(x,s,r)),
        context = new AudioContext(),
        devices = new Promise((s,r) => {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                s(devices.filter(d => d.kind === "audioinput"));
            }).catch(r);
        });

    return {
        getDevices: () => devices,
        attachListener: (device,channel,bufsize,callback) => {
            return new Promise((s,r) => {
                getStream(constraints(device)).then(stream =>{
                    var input = context.createMediaStreamSource(stream),
                        sampleRate = context.sampleRate,
                        recorder = context.createScriptProcessor(bufsize,2,2),
                        gainNode = context.createGain();
                    recorder.onaudioprocess = e => {
                        var data = e.inputBuffer.getChannelData(channel);
                        callback(data);
                    };
                    
                    input.connect(gainNode);
                    gainNode.connect(recorder);
                    s({
                        sampleRate: () => sampleRate,
                        gain: (x) => 
                            typeof x === "undefined"
                                ? gainNode.gain.value
                                : gainNode.gain.value = x,
                        start: ()=>recorder.connect(context.destination),
                        stop: ()=>recorder.disconnect(context.destination),
                    });
                }).catch(r);
            });
        }
    };
})();

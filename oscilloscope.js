"use strict"

var CircularBuffer = (bufsize) => {
    var buffer = new Float32Array(bufsize), 
        head = 0,
        tail = 0,
        length = () => tail >= head ? tail - head : bufsize - (head - tail);
    return {
        append: (data) => {
            if (data.length > bufsize - length()){
                console.log("buffer overrun");
            }
            var right;//size to right of tail
            while (data.length > 0){
                right = bufsize - tail;
                if (right > data.length){
                    //place data into right side
                    buffer.set(data, tail);
                    if (tail < head && head <= tail + data.length){
                        head = (tail + data.length + 1) % bufsize;
                    }
                    tail = (tail + data.length) % bufsize;
                    break;
                } else {
                    buffer.set(data.slice(0,right), tail);
                    if (head > tail || head == 0){
                        head = 1;
                    }
                    tail = 0;
                    data = data.slice(right);
                }
            }
            //console.log(buffer,head,tail);
        },
        length: length,
        consume: (size) => {
            var len = Math.min(size, length()),
                ret = new Float32Array(len),
                right = bufsize - head;
            if (size > len){
                console.log("buffer underrun")
            }
            if (right > len){
                ret.set(buffer.slice(head, head + len));
            } else {
                ret.set(buffer.slice(head));
                ret.set(buffer.slice(0,len - right));
            }
            head = (head + len) % bufsize;
            return ret;
        }
    }
}

var Oscilloscope = (graph, bufsize) => {
    //default settings
    var settings = {
            level: 0.0,
            type: "rising"
        },
        triggerTypes = {
            rising:  (prev,curr) => prev === true && curr === false,
            falling: (prev,curr) => prev === false && curr === true,
            toggle:  (prev,curr) => prev !== curr
        },
        buffer = CircularBuffer(bufsize);

    return {
        setTrigger: (o) => {
            settings = o;
        },
        onData: buffer.append,
        getData: (len) => {
            var level = settings.level,
                condition = triggerTypes[settings.type];
                previous = buffer.consume(1)[0] < level;

            do {
                let current = buffer.consume(1)[0] < level;
            } while (!condition(previous, current));

            return buffer.consume(len);
        }
    };
}


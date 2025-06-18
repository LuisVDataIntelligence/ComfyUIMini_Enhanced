import mitt from "mitt";

type EmitterEvents = {
    [key: string]: any;
}

const emitter = mitt<EmitterEvents>();

export default emitter;
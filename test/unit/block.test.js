import { blockClass } from "../../src/vm/extensions/block/index.js";

describe("blockClass", () => {
    const formatMessage = function (msg) {
        return msg.default;
    };
    formatMessage.setup = () => null;
    const runtime = {
        formatMessage: formatMessage
    };

    test("should create an instance of blockClass", () => {
        const block = new blockClass(runtime);
        expect(block).toBeInstanceOf(blockClass);
    });

    test("getInfo() should return metadata with pasorich blocks", () => {
        const block = new blockClass(runtime);
        const info = block.getInfo();
        expect(info.id).toBe("pasorich");
        const opcodes = info.blocks
            .filter(b => typeof b === "object")
            .map(b => b.opcode);
        expect(opcodes).toEqual([
            "openPasori",
            "readPasori",
            "getIdm",
            "resetIdm",
            "resetDevice",
            "whenRead"
        ]);
    });

    test("getIdm should return null when no device is registered", () => {
        const block = new blockClass(runtime);
        expect(block.getIdm({DEVICE_NUMBER: "1"})).toBeNull();
    });

    test("getDeviceNumberMenuItems should return a placeholder when empty", () => {
        const block = new blockClass(runtime);
        expect(block.getDeviceNumberMenuItems()).toEqual([{text: " ", value: " "}]);
    });
});

import {
  loadActionMap,
  saveActionMap,
  loadShortcutList,
  saveShortcutList,
  loadToken,
  saveToken,
} from "./storage";

describe("storage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe("loadActionMap", () => {
    it("should get an empty object initially", () => {
      const rv = loadActionMap();
      expect(rv).toEqual({});
    });

    it("should get data from `actionMap`", () => {
      const expected = {
        video: "vlc",
      };
      localStorage.setItem("actionMap", JSON.stringify(expected));
      const rv = loadActionMap();
      expect(rv).toEqual(expected);
    });
  });

  describe("saveActionMap", () => {
    it("should set data to `actionMap`", () => {
      const expected = {
        audio: "vlc",
      };
      saveActionMap(expected);
      const rv = localStorage.getItem("actionMap");
      expect(rv).not.toBeNull();
      expect(JSON.parse(rv)).toEqual(expected);
    });
  });

  describe("loadShortcutList", () => {
    it("should get an empty list initially", () => {
      const rv = loadShortcutList();
      expect(rv).toEqual([]);
    });

    it("should get data from `shortcutList`", () => {
      const expected = ["/tmp"];
      localStorage.setItem("shortcutList", JSON.stringify(expected));
      const rv = loadShortcutList();
      expect(rv).toEqual(expected);
    });
  });

  describe("saveShortcutList", () => {
    it("should set data to `shortcutList`", () => {
      const expected = ["/dev/run"];
      saveShortcutList(expected);
      const rv = localStorage.getItem("shortcutList");
      expect(rv).not.toBeNull();
      expect(JSON.parse(rv)).toEqual(expected);
    });
  });

  describe("loadToken", () => {
    it("should get an empty string initially", () => {
      const rv = loadToken();
      expect(rv).toEqual("");
    });

    it("should get data from `loadToken`", () => {
      const expected = "token";
      localStorage.setItem("token", expected);
      const rv = loadToken();
      expect(rv).toEqual(expected);
    });
  });

  describe("saveToken", () => {
    it("should set data to `saveToken`", () => {
      const expected = "token";
      saveToken(expected);
      const rv = localStorage.getItem("token");
      expect(rv).toEqual(expected);
    });
  });
});

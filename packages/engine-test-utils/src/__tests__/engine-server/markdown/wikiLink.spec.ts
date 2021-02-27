import {
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  DEngineClientV2,
  MDUtilsV4,
  UnistNode,
  WikiLinkNoteV4,
  wikiLinks,
  WikiLinksOpts,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { checkVFile, createProcForTest, createProcTests } from "./utils";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: WikiLinksOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(wikiLinks, opts);
}

function genDendronData(opts?: Partial<DendronASTData>): DendronASTData {
  return { ...opts } as any;
}

function getWikiLink(node: UnistNode): WikiLinkNoteV4 {
  // @ts-ignore
  return node.children[0].children[0];
}

describe("wikiLinks", () => {
  describe("parse", () => {
    let engine: any;
    let dendronData = { dest: DendronASTDest.MD_REGULAR };

    test("basic", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        `[[foo.md]]`
      );
      expect(getWikiLink(resp).type).toEqual("wikiLink");
    });

    test("link with space", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        `[[foo bar]]`
      );
      expect(_.pick(getWikiLink(resp), ["type", "value"])).toEqual({
        type: "wikiLink",
        value: "foo bar",
      });
    });

    test("doesn't parse inline code block", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "`[[foo.md]]`"
      );
      expect(getWikiLink(resp).type).toEqual("inlineCode");
    });
  });

  describe("compile", () => {
    const linkRegular = "[[foo]]";

    const REGULAR_CASE = createProcTests({
      name: "regular",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(linkRegular);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkRegular);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html">foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAnchor = "[[foo#one]]";
    const WITH_ANCHOR = createProcTests({
      name: "WITH_ANCHOR",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(linkWithAnchor);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAnchor);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html#one">foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithExtension = "[[foo.md]]";
    const WITH_EXTENSION = createProcTests({
      name: "WITH_EXTENSION",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithExtension);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[[foo]]");
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html">foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAlias = `[[bar|foo]]`;
    const WITH_ALIAS = createProcTests({
      name: "WITH_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html">bar</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const WITH_ID_AS_LINK = createProcTests({
      name: "WITH_ID_AS_LINK",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          useIdAsLink: true,
        });
        const resp = await proc.process(linkRegular);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkRegular);
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo-id.html">foo</a>');
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "foo",
          vault: vaults[0],
          props: { id: "foo-id" },
        });
      },
    });

    const linkWithSpaceAndAlias = `[[bar|foo bar]]`;
    const WITH_SPACE_AND_ALIAS = createProcTests({
      name: "WITH_SPACE_AND_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithSpaceAndAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithSpaceAndAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo%20bar)");
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo%20bar.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromSameVaultWithAlias = "[[bar|dendron://vault1/foo]]";
    const WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS = createProcTests({
      name: "WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkFromSameVaultWithAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromSameVaultWithAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html">bar</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromSameVault = "[[dendron://vault1/foo]]";
    const WITH_XVAULT_LINK_TO_SAME_VAULT = createProcTests({
      name: "WITH_XVAULT_LINK_TO_SAME_VAULT",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkFromSameVault);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromSameVault);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo.html">foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromOtherVault = "[[dendron://vault2/foo]]";
    const WITH_XVAULT_LINK_TO_OTHER_VAULT = createProcTests({
      name: "WITH_XVAULT_LINK_TO_OTHER_VAULT",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          useIdAsLink: true,
        });
        const resp = await proc.process(linkFromOtherVault);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromOtherVault);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo-2.html">foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[foo](../vault2/foo.md)");
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          wsRoot,
          vault: vault2,
          props: {
            id: "foo-2",
          },
        });
      },
    });

    const ALL_TEST_CASES = [
      ...REGULAR_CASE,
      ...WITH_ANCHOR,
      ...WITH_EXTENSION,
      ...WITH_ALIAS,
      ...WITH_ID_AS_LINK,
      ...WITH_SPACE_AND_ALIAS,
      ...WITH_XVAULT_LINK_TO_SAME_VAULT,
      ...WITH_XVAULT_LINK_TO_OTHER_VAULT,
      ...WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS,
    ];

    test.each(
      ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
});

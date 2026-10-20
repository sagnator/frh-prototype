/* FRH final version. The builder files still tag elements with the dev-spec IDs they
   implement (A1, H3, S7 …) so the code stays traceable to spec/FINAL-DECISIONS.md,
   but nothing is painted: these helpers return empty strings. */
(function () {
  const F = window.FRH;
  F.DEVPREP = F.DEVPREP || {};
  F.chgAttr = () => '';
  F.chgTag = () => '';
  F.chgScreen = () => '';
  F.chgNote = () => '';
})();

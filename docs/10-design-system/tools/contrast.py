#!/usr/bin/env python3
"""WCAG 2 contrast of every SDC v2 token pair, both themes. Usage: python3 contrast.py  (exit 1 on any failure)."""
import sys
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
NEW = ['f87171','2a1013','2a1f05','60a5fa','0c1a2e','7a4f00','fff4dc','b91c1c','fdecec','1d4ed8','e8f0fe']
# name: (dark, light, current_dark, current_light, role)
T = [
 ('canvas','050d09','f4faf6','050d09','f4faf6','Page background.'),
 ('band','061812','e5f5ea',None,None,'Full-width tinted section bands (alternate sections, news band, partner strip).'),
 ('surface','0d1512','ffffff','0d0e12','ffffff','Cards, header bar, footer, auth form side.'),
 ('surface-raised','131916','f3f9f6','16181d','f8fcf9','Nested surfaces: closed accordion items, table header, hovered rows, chips at rest.'),
 ('surface-overlay','0d1512','ffffff','0d1117','ffffff','Dialogs, bottom sheets, menus, toasts.'),
 ('field','131916','f3f9f6',None,None,'Input, select and textarea fill.'),
 ('border','1d2620','cbe7d4','rgba(255,255,255,.15)','cbe7d4','Decorative hairlines between and around content (not a control boundary).'),
 ('border-strong','5c7a70','6b8a80',None,None,'Control boundaries: inputs, checkboxes, outline buttons. Meets 3:1.'),
 ('border-accent','28674b','a9d8bc','rgba(0,230,118,.3)','a9d8bc','Accent-framed surfaces: dialog edge, selected card, header hairline.'),
 ('text','ffffff','123b35','ffffff','123b35','Body and headings.'),
 ('text-muted','8fa79b','4b635a','9ca3af','52766c','Ledes, meta rows, captions, helper text.'),
 ('text-subtle','7a9a90','5c7a70',None,None,'Placeholders and disabled labels only (never information the reader needs).'),
 ('text-on-accent','08090c','ffffff','08090c','ffffff','Label on the accent fill (primary button).'),
 ('accent','00e676','0a7a49','00e676','0a7a49','Primary button fill, active nav marker, selected state.'),
 ('accent-hover','00c853','067847','00c853','067847','Hover and pressed accent fill.'),
 ('accent-text','00e676','0a7a49',None,None,'Links, active nav text, accent icons on any surface.'),
 ('accent-soft','143426','e5f5ea','abefc6','cbe7d4','Tinted fill: selected chip, open accordion item, active tab, success alert.'),
 ('on-accent-soft','abefc6','0d3329',None,None,'Text on accent-soft.'),
 ('signal','00e676','0b8f55',None,None,'Decorative marks and large display numerals (24px+) only: motif dots, stat figures, glows. Never body text.'),
 ('brand','067847','72c99a','067847','72c99a','Deep brand fill: secondary filled button, brand panel.'),
 ('on-brand','ffffff','0d3329',None,None,'Text on the brand fill.'),
 ('success','72c99a','067847',None,None,'Success text and icons.'),
 ('success-soft','143426','e5f5ea',None,None,'Success alert and pill fill.'),
 ('warning','ffab00','7a4f00','ffab00','ffab00','Warning text and icons; "closes soon".'),
 ('warning-soft','2a1f05','fff4dc',None,None,'Warning alert and pill fill.'),
 ('danger','f87171','b91c1c','ef4444','ef4444','Error text, error borders, error icons.'),
 ('danger-soft','2a1013','fdecec',None,None,'Error alert and pill fill.'),
 ('danger-fill','ef4444','b91c1c',None,None,'Destructive button fill.'),
 ('on-danger-fill','050d09','ffffff',None,None,'Label on the destructive fill.'),
 ('info','60a5fa','1d4ed8',None,None,'Informational text and icons.'),
 ('info-soft','0c1a2e','e8f0fe',None,None,'Info alert and pill fill.'),
 ('focus-ring','00e676','0a7a49',None,None,'2px focus outline, 2px offset.'),
 ('qr-ground','ffffff','ffffff',None,None,'White quiet zone behind QR codes in both themes (scanners need light around the code). Nowhere else.'),
]
MIX = [('scrim','color-mix(in srgb, var(--c-000000) 75%, transparent)','color-mix(in srgb, var(--c-123b35) 45%, transparent)','Dialog and sheet backdrop.')]
TOK = {n:(d,l) for n,d,l,*_ in T}
# text pairs: fg token -> list of bg tokens ; level 4.5 text, 3.0 large/non-text
PAIRS = [
 ('text',['canvas','band','surface','surface-raised','field','accent-soft'],4.5),
 ('text-muted',['canvas','band','surface','surface-raised','field'],4.5),
 ('accent-text',['canvas','band','surface','surface-raised'],4.5),
 ('text-on-accent',['accent','accent-hover'],4.5),
 ('on-accent-soft',['accent-soft'],4.5),
 ('on-brand',['brand'],4.5),
 ('success',['surface','success-soft'],4.5),
 ('warning',['surface','canvas','warning-soft'],4.5),
 ('danger',['surface','canvas','field','danger-soft'],4.5),
 ('on-danger-fill',['danger-fill'],4.5),
 ('info',['surface','info-soft'],4.5),
 ('text-subtle',['field'],None),
 ('border-strong',['canvas','surface','field','surface-overlay'],3.0),
 ('focus-ring',['canvas','band','surface','surface-raised'],3.0),
 ('signal',['canvas','surface'],3.0),
]
def table():
    rows=[]
    for fg,bgs,lvl in PAIRS:
        for bg in bgs:
            d=cr(TOK[fg][0],TOK[bg][0]); l=cr(TOK[fg][1],TOK[bg][1])
            rows.append((fg,bg,d,l,lvl))
    return rows
if __name__ == '__main__':
    failed = False
    for fg, bg, d, l, lvl in table():
        bad = bool(lvl) and (d < lvl or l < lvl)
        failed |= bad
        print(f'{"FAIL " if bad else "ok   "}--{fg:16} on --{bg:16} dark {d:5.2f}  light {l:5.2f}  need {lvl or "-"}')
    sys.exit(1 if failed else 0)

import { StyleRules } from '@material-ui/core/styles';


export const SELECTION_COLOR = 'hsl(210, 100%, 25%)';
export const MAIN_MENU_WIDTH = 240;
export const FONT_FAMILY = [
  'Roboto',
  'Hiragino Kaku Gothic Pro',
  'Meiryo',
  'Noto Sans CJK JP',
  'sans-serif',
].map((s) => `"${s}"`).join(', ');


type CSSRules = StyleRules[keyof StyleRules];


type MixinName = (
  | 'hbox'
  | 'vbox'
  | 'size-grow'
  | 'size-shrink'
  | 'w-100'
  | 'w-50'
  | 'h-100'
  | 'mh-0'
  | 'scrollable'
  | 'no-scroll'
  | 'y-scroll'
);


export function getMixins (nameList: MixinName[]) {
  const rv: CSSRules = {};
  for (const name of nameList) {
    switch (name) {
      case 'hbox':
        rv.display = 'flex';
        break;
      case 'vbox':
        rv.display = 'flex';
        rv.flexDirection = 'column';
        break;
      case 'size-grow':
        rv.flex = 'auto';
        break;
      case 'size-shrink':
        rv.flex = '0 0 auto';
        break;
      case 'w-100':
        rv.width = '100%';
        break;
      case 'h-100':
        rv.height = '100%';
        break;
      case 'w-50':
        rv.width = '50%';
        break;
      case 'mh-0':
        rv.minHeight = 0;
        break;
      case 'scrollable':
        rv.overflow = 'scroll';
        break;
      case 'no-scroll':
        rv.overflow = 'hidden';
        break;
      case 'y-scroll':
        rv.overflowY = 'scroll';
        break;
      default:
        break;
    }
  }
  return rv;
}

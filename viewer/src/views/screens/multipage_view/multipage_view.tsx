import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { ImportContacts as ImportContactsIcon } from '@material-ui/icons';

import { ImageView } from '@/views/widgets/image_view';
import { ImageData } from '@/states/multipage/types';
import { IGlobalStateType } from '@/states/reducers';
import { useInstance, getMixins } from '@/lib';
import { useFullScreen } from '@/views/hooks/fullscreen';


const useStyles = makeStyles((theme) => ({
  multiPageView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'y-scroll',
    ]),
  },
}));


interface IPropsType {
  imageList: ImageData[];
}
function MultiPageView (props: IPropsType) {
  const root = React.useRef<HTMLDivElement>(null);
  const classes = useStyles();
  const { toggleFullScreen } = useFullScreen();
  const { onIntersect } = useActions(props, root);
  useObserver(root, onIntersect);

  return (
    <div
      className={classes.multiPageView}
      ref={root}
      onClick={toggleFullScreen}
    >
      {props.imageList.map((d, index) => (
        <React.Fragment key={index}>
          <ImageView
            rootRef={root}
            width={d.width}
            height={d.height}
            url={d.url}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
function mapStateToProps (state: IGlobalStateType) {
  const { imageList } = state.mpv;
  return {
    imageList,
  };
}
const ConnectedMultiPageView = connect(mapStateToProps)(MultiPageView);
export { ConnectedMultiPageView as MultiPageView };


function useActions (props: IPropsType, rootRef: React.RefObject<HTMLDivElement>) {
  const [dirty, setDirty] = React.useState(false);

  const self = useInstance(() => ({
    onIntersect (entries: IntersectionObserverEntry[]) {
      if (!rootRef.current) {
        return;
      }
      const root = rootRef.current;
      entries.forEach(entry => {
        if (dirty && entry.isIntersecting) {
          root.scrollTop = 0;
          setDirty(false);
        }
      });
    },
  }), [rootRef, dirty, setDirty]);

  React.useEffect(() => {
    setDirty(true);
  }, [props.imageList, setDirty]);

  const onIntersect = React.useCallback((entries: IntersectionObserverEntry[]) => {
    self.current.onIntersect(entries);
  }, [self]);

  return {
    dirty,
    onIntersect,
  };
}


function useObserver (
  rootRef: React.RefObject<HTMLDivElement>,
  onIntersect: IntersectionObserverCallback,
) {
  const options = {
    root: document.body,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0,
  };
  const observer = React.useRef(new IntersectionObserver(onIntersect, options));

  React.useEffect(() => {
    if (rootRef.current) {
      observer.current.observe(rootRef.current);
    }
    return () => {
      observer.current.disconnect();
    };
  }, [rootRef.current, observer]);
}


export { ImportContactsIcon as MultiPageViewIcon };

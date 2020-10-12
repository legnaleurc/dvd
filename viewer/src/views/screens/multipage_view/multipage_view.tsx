import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ImportContacts as ImportContactsIcon } from '@material-ui/icons';

import { useInstance, getMixins } from '@/lib';
import { useFullScreen } from '@/views/hooks/fullscreen';
import { useComicState } from '@/views/hooks/comic';
import { ImageView } from './image_view';


const useStyles = makeStyles((theme) => ({
  multiPageView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'y-scroll',
    ]),
  },
}));


export function MultiPageView (props: {}) {
  const root = React.useRef<HTMLDivElement>(null);
  const classes = useStyles();
  const { toggleFullScreen } = useFullScreen();
  const { imageList, onIntersect } = useActions(root);
  useObserver(root, onIntersect);

  return (
    <div
      className={classes.multiPageView}
      ref={root}
      onClick={toggleFullScreen}
    >
      {imageList.map((d, index) => (
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


function useActions (rootRef: React.RefObject<HTMLDivElement>) {
  const { imageList } = useComicState();
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
  }, [imageList, setDirty]);

  const onIntersect = React.useCallback((entries: IntersectionObserverEntry[]) => {
    self.current.onIntersect(entries);
  }, [self]);

  return {
    imageList,
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

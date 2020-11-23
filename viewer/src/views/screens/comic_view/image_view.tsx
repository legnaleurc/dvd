import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';

import { useInstance } from '@/lib';


const useStyles = makeStyles((theme) => ({
  imageView: {
    maxWidth: '100%',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
  },
}));


interface IPropsType {
  rootRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  url: string;
}


export function ImageView (props: IPropsType) {
  const { width, height } = props;
  const classes = useStyles();
  const { url, loaded, onIntersect } = useActions(props);
  const { targetRef } = useObserver(props.rootRef, onIntersect);
  return (
    <div
      className={classes.imageView}
      ref={targetRef}
    >
      <img
        className={clsx(classes.image, {
          loaded,
        })}
        src={url}
        width={width}
        height={height}
      />
    </div>
  );
}


function useActions (props: IPropsType) {
  const { width, height } = props;
  const [url, setUrl] = React.useState(() => createDummyImage(width, height, 'gray'));
  const [loaded, setLoaded] = React.useState(false);

  const self = useInstance(() => ({
    setImageUrl () {
      setUrl(props.url);
      setLoaded(true);
    },
  }), [
    props.url,
    setUrl,
    setLoaded,
  ]);

  const onIntersect = React.useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        self.current.setImageUrl();
      }
    });
  }, [self]);

  return {
    url,
    loaded,
    onIntersect,
  };
}


function useObserver (
  rootRef: React.RefObject<HTMLDivElement>,
  onIntersect: IntersectionObserverCallback,
) {
  const targetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!rootRef.current || !targetRef.current) {
      return;
    }

    const observer = new IntersectionObserver(onIntersect, {
      root: rootRef.current,
      rootMargin: '400% 0px 400% 0px',
      threshold: 0,
    });
    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
    };
  }, [rootRef.current, targetRef.current, onIntersect]);

  return {
    targetRef,
  };
}


function createDummyImage (width: number, height: number, color: string) {
  const svg = [
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      `<rect width="100%" height="100%" fill="${color}" />`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

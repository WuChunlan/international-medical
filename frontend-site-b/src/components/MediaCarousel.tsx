import { useRef } from 'react';
import { Carousel } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { MediaItem } from '../types';
import './MediaCarousel.less';

interface MediaCarouselProps {
  mediaList: MediaItem[];
}

function MediaSlide({ item }: { item: MediaItem }) {
  if (item.mediaType === 'video') {
    return (
      <div className="media-carousel__slide">
        <video
          src={item.url}
          controls
          className="media-carousel__video"
        />
      </div>
    );
  }
  return (
    <div className="media-carousel__slide">
      <img src={item.url} alt="" className="media-carousel__img" />
    </div>
  );
}

export default function MediaCarousel({ mediaList }: MediaCarouselProps) {
  const carouselRef = useRef<CarouselRef>(null);

  if (!mediaList || mediaList.length === 0) return null;

  if (mediaList.length === 1) {
    return (
      <div className="media-carousel media-carousel--single">
        <MediaSlide item={mediaList[0]} />
      </div>
    );
  }

  return (
    <div className="media-carousel">
      <button
        className="media-carousel__arrow media-carousel__arrow--prev"
        onClick={() => carouselRef.current?.prev()}
        aria-label="Previous"
      >
        <LeftOutlined />
      </button>

      <Carousel ref={carouselRef} dots className="media-carousel__inner">
        {mediaList.map((item) => (
          <MediaSlide key={item.id} item={item} />
        ))}
      </Carousel>

      <button
        className="media-carousel__arrow media-carousel__arrow--next"
        onClick={() => carouselRef.current?.next()}
        aria-label="Next"
      >
        <RightOutlined />
      </button>
    </div>
  );
}

import React, { useState } from 'react';

const PopupOnCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleMouseMove = (event) => {
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseEnter = () => {
    setIsPopupVisible(true);
  };

  const handleMouseLeave = () => {
    setIsPopupVisible(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove} // マウスの位置を追跡
      onMouseEnter={handleMouseEnter} // マウスが要素に入ったとき
      onMouseLeave={handleMouseLeave} // マウスが要素から出たとき
      style={{ height: '200px', border: '1px solid black', position: 'relative' }}
    >
      ホバーでポップアップを表示

      {isPopupVisible && (
        <div
          style={{
            position: 'absolute',
            top: position.y, // カーソル位置から少し下に表示
            left: position.x + 10, // カーソル位置から少し右に表示
            backgroundColor: 'lightgray',
            padding: '8px',
            borderRadius: '4px',
            pointerEvents: 'none', // ポップアップがマウスイベントを受け取らないようにする
          }}
        >
          ここにポップアップ内容
        </div>
      )}
    </div>
  );
};

export default PopupOnCursor;
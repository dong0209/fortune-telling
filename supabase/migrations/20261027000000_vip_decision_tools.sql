-- 付費版「看懂命盤」、VIP「幫你做決定」：offer 比較、現職適配度、每月吉日、未來 7 天運勢改為 VIP 專屬
update public.plans set description = '八字、紫微斗數、西洋星盤、易經、生命靈數、姓名學完整解讀，36 個月時機曲線與月份詳解，今天的職場運勢與公司類型排名，可同時交叉比對 2 種學派'
where id = 'paid';
update public.plans set description = '付費版全部內容，加上梅花易數、九宮飛星、奇門遁甲、人類圖，未來 7 天運勢與每月職場吉日，offer 比較、現職適配度、主管／同事合盤等決策工具，東西方學派不限種類交叉比對'
where id = 'vip';

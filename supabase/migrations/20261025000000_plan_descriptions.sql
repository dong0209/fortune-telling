-- 方案說明改以「東西方學派交叉比對」為主軸；梅花易數、九宮飛星改列 VIP
update public.plans set description = '協助測試付費版：八字、紫微斗數、西洋星盤、易經、生命靈數、姓名學完整解讀，36 個月時機曲線，可同時交叉比對 2 種學派'
where id = 'paid';
update public.plans set description = '協助測試 VIP 版：付費版全部內容，加上梅花易數、九宮飛星、奇門遁甲、人類圖與主管合盤，東西方學派不限種類交叉比對'
where id = 'vip';

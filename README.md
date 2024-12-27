# Google和Github第三方登入  
### git clone 這份專案下來後，先npm i 將modules載齊，並將.env.sample改成，並將env檔中的client_id和scret_key填入，即可運作。  

 ![image]( https://github.com/yhn2983/oath_test/blob/main/github_img/%E7%99%BB%E5%85%A5%E7%95%AB%E9%9D%A2.png
)  

##### 後端是用node.js
##### 前端檔案是用 ejs，畫面是套用 tailwind ui方登入  
    
當點選按鈕後，用post方法傳送到後端，透過google(github)提供的api連結到google(github)登入畫面，完成google(github)登入後即可登入頁面。


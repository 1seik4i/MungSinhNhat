const paths={};
const entries={
  '/config':{get:'Cấu hình công khai'},'/fortune-catalog':{get:'100 quẻ hệ thống'},
  '/register':{post:'Đăng ký có CAPTCHA'},'/login':{post:'Đăng nhập'},'/logout':{post:'Đăng xuất'},'/me':{get:'Phiên hiện tại'},
  '/email':{post:'Gửi email xác minh/reset'},'/consume':{post:'Dùng token xác minh/reset'},
  '/page':{get:'Đọc trang của tôi',post:'Tạo trang của tôi',put:'Lưu nháp theo revision',delete:'Xóa trang của tôi'},
  '/generate':{post:'Tạo/cập nhật snapshot'},'/share':{post:'Bật/đổi QR 72 giờ',delete:'Thu hồi QR'},
  '/media':{post:'Tải media riêng'},'/media/{id}':{get:'Đọc media riêng',head:'Metadata media'},
  '/viewer/{id}/exchange':{post:'Đổi token QR lấy cookie xem'},'/viewer/{id}/page':{get:'Đọc snapshot được chia sẻ'},'/viewer/{id}/media/{asset}':{get:'Đọc media của snapshot',head:'Metadata media viewer'},
};
const bodies={
 '/register':{email:'you@example.com',password:'your-password-12+',confirmation:'your-password-12+',captchaToken:'CAPTCHA_TOKEN_FROM_BROWSER'},
 '/login':{email:'you@example.com',password:'your-password-12+'},
 '/page':{revision:1,content:{}},'/generate':{revision:1},'/share':{rotate:false},'/media':{dataUrl:'data:image/png;base64,...'},
 '/email':{email:'you@example.com',purpose:'reset'},'/consume':{purpose:'reset',key:'TOKEN',password:'your-password-12+'},'/viewer/{id}/exchange':{key:'QR_FRAGMENT_TOKEN'},
};
for(const [path,methods] of Object.entries(entries)){
 paths['/api/platform'+path]={};
 for(const [method,summary] of Object.entries(methods)){
  const parameters=[...path.matchAll(/\{(\w+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:{type:'string'}}));
  const example=bodies[path];
  paths['/api/platform'+path][method]={summary,parameters,...(['post','put'].includes(method)&&example?{requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:true},example}}}}:{}),responses:Object.fromEntries([200,201,202,401,403,404,409,413,415,422,429,503].map(code=>[code,{description:code<300?'Thành công':'Lỗi xác thực, dữ liệu hoặc dịch vụ'}]))};
 }
}
export default {openapi:'3.0.3',info:{title:'CMSN API',version:'0.1.0',description:'Dùng cookie HttpOnly cùng origin. Với PUT /page, lấy draft và revision từ GET /page rồi gửi {content: draft, revision}. Try it out có thể ghi/xóa dữ liệu: chỉ dùng tài khoản staging. CAPTCHA lấy từ widget thật, không có bypass.'},servers:[{url:'/'}],paths};

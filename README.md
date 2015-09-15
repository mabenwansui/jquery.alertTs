# jquery.alertTs
气泡弹出插件

##全部参数
    face: "top",
    left: 0, //左边距  支持正负数
    top: 0,
    act: "", //触发事件 click, otherClick, hover
    aSize: 6, //三角的大小
    aLoc: "auto", //角的位置 数字型 或 auto
    effect: "", //动画效果 fade
    effectSpeed: 400, //动画时间
    close: false, //是否显示关闭
    content: "请添加内容",
    loading: null,
    position: false, //建议设为true true弹框脱离布局限制对齐，false以父级对齐。
    width: "auto", //"auto" "limit" number(例:30或30px) add[number](例:add5)
    minWidth: 50,     
    height: null,
    minHeight: 20,
    cache: true,  //是否在页面里缓存，如果为false，则弹框消失后会删掉相应的dom
    delay: 300, //鼠标划过延迟
    css: null,
    cssStyle: null,  //选择某种样式
    timeout: null,   //多少秒后关闭
    callback: { //回调 所有的this都是类的本身
      init: function () {},
      show: function () {},
      beforeShow: function () {},
      hide: function () {}
    }

####简单使用
    $('.btn1').alertTs({
      position : true
    });

####向下并居中
    $('.btn2').alertTs({
      aLoc : 'center',
      face : 'bottom',
      position : true
    });

####鼠标事件
    $('.btn4').alertTs({
      act : 'hover',   //click, otherClick
      face : 'left', 
      cssStyle : 'blue',  //选取样式
      left  : -10,
      top   : -20,
      aLoc  : 20,   //三角偏移距离
      aSize : 14,   //三角形大小
      css : {
        fontSize : 20,
        padding : "20px"
      },
      position : true
    });

####带loading的使用
    LT.File.Js.load("http://h.pc.lietou-static.com/v1/js/plugins/jquery.alertTs.js", function () {
      $('dom').alertTs({
        resid: null, //必须
        act: "otherClick",
        face: "bottom",
        content: "",
        minHeight: 40,
        cache: false,
        width: 240,
        top: 5,
        zIndex: "auto,200",
        loading: "http://h.pc.lietou-static.com/v1/images/icons/loading1.gif",
        position: true,
        aSize: 0,
        css: {
          "padding": 0,
          "border-radius": "none",
          "background": "#fff",
          "border": "1px solid #ccc",
          "color": "none"
        },
        callback: {
          show: function () {
            var that = this;
            that.loading("show");
            $.ajax({
              url: "/resumemanage/getselectedgroupbyresumeid/",
              data: {
                res_id_encode: options.resid
              },
              cache: false,
              type: "GET",
              dataType: "json",
              success: function (data) {
                that.loading("hide");
                } else {
                  $.dialog.error(data.msg);
                };
              }
            });
          }
        });
    });
/*
  日志 iswindowBorder 机制  修改

  @ 方法
    $(".elementName").alertTs();
    $(".elementName").alertTs("show");
    $(".elementName").alertTs("hide");        
    $(".elementName").alertTs("face","top");   改变弹框的方向
    $(".elementName").alertTs("zIndex",9999);
    $(".elementName").alertTs("css",{border:"1px solid #ff0000"});

  @ 扩展
    $.alertTs.setup({});                       设置全局样式      
    $.alertTs.error(id,msg,[options,func]);    出错提示
    $.alertTs.parent(element);                 传入的是helper内的元素，返回helper的self
*/
var _i=0;
;(function ($, window) {
  "use strict";
  var pluginName = "alertTs",
    classname = "alertTs-js",
    document = window.document,
    defaults = {
      face: "top",
      left: 0, //左边距  支持正负数
      top: 0,
      act: "", //触发事件 click, otherClick, hover
      aSize: 6, //三角的大小
      aLoc: "auto", //角的位置 数字型 或 auto
      effect: "", //动画效果 fade
      effectSpeed: 400, //动画时间
      zIndex: "auto",
      close: false, //是否显示关闭
      content: "请添加内容",
      loading: null,
      position: false, //为true时，弹框脱离布局限制以浏览器为标准进行位置对齐，为false时，弹框以元素位置为参照对齐。
      width: "auto", //"auto" "limit" number(例:30或30px) add[number](例:add5)
      minWidth: 50, //IE6不支持        
      height: null,
      minHeight: 20,
      cache: true,
      delay: 300, //鼠标划过延迟
      css: null,
      cssStyle: null,
      timeout: null,
      callback: { //回调 所有的this都是类的本身
        init: function () {},
        show: function () {},
        beforeShow: function () {},
        hide: function () {}
      }
    },
    colorStyle = {
      defaults: {
        "border-width": "1px",
        "border-color": "#ffd999",
        "border-style": "solid",
        "border-radius": "4px",
        "background-color": "#fff7e9",
        "box-shadow": "1px 1px 2px rgba(0,0,0,0.1)",
        "color": "#e75c00",
        "padding": "3px 10px",
        "font-size": "12px",
        "line-height": "20px",
        "closeColor": "#cc0000",
        "closeSize": "12px"
      }
    };

  function Plugin(element, options) {
    options.cssStyle ? (defaults.css = colorStyle[options.cssStyle]) : (defaults.css = colorStyle["defaults"]);
    var public_ = this,
      private_ = this,
      self = this,
      timer = null;
    public_.element = element;
    public_.helper = null;
    public_.wrap = null;
    private_.options = $.extend(true, {}, defaults, options);
    private_.id = ++$[pluginName].id;
    private_.closex = null;
    private_.arrow = null;
    private_.$content = null;
    private_.alocLeft = null;
    private_.visible = false;
    private_.timeout = null;
    private_.left = self.options.left;
    private_.top = self.options.top;

    public_.face = function (str, refresh) {
      if (arguments.length == 1) refresh = true;
      if (refresh) {
        if (self.options.face == "left" && str == "right" || self.options.face == "right" && str == "left") {
          self.left = -Number(self.left);
        } else if (self.options.face == "top" && str == "bottom" || self.options.face == "bottom" && str == "top") {
          self.top = -Number(self.top);
        };
        self.options.face = str;
        self.refresh();
      } else {
        self.options.face = str;
      }
      return self;
    };
    public_.loading = function (display) {
      if (display == "show") {
        self.$loading.show();
        self.resize.reLoading();
      } else {
        self.$loading.hide();
      };
      return self;
    };
    public_.content = function (str) {
      self.$content.html(str);
      self.refresh();
      return self;
    };
    public_.css = function (options) {
      $.extend(self.options.css, options || {});
      self.helper.css(self.options.css);
      self.refresh();
      return self;
    };
    public_.show = function (notString) {
      self.options.callback.beforeShow.call(self);
      self.refresh();
      if (self.visible) return self;      
      self.options.position && self.play();
      self.visible = true;
      switch (self.options.effect) {
        case "fade":
          self.helper.show().stop().css("opacity", 0).animate({
            opacity: 1
          }, self.options.effectSpeed, function () {
            self && self.helper.css("opacity", "");
          });
          break;
        default:
          self.helper.show();
      };
      self.options.callback.show.call(self);
      return self;
    };
    public_.hide = function () {
      self.visible = false;
      self.options.position && self.stop();
      self.options.callback.hide.call(self);
      switch (self.options.effect) {
        case "fade":
          self.helper.stop().animate({
            opacity: 0
          }, self.options.effectSpeed / 1.8, function () {
            if (self) {
              self.options.cache ? self.helper.hide() : self.removeTag();
            };
          });
          break;
        default:
          self.options.cache ? self.helper.hide() : self.removeTag();
      };
      return self;
    };
    public_.removeTag = function () {
      self.stop();
      self.timeout && clearTimeout(self.timeout);
      Groups.remove(self);
      if (!self.options.position) self.helper.unwrap();
      self.helper.stop().remove();
      self.element.removeData('plugin_' + pluginName);
      self.options.act == "otherClick" && $(document).unbind("click." + pluginName + self.id);
    };
    public_.destroy = function () {
      switch (self.options.act) {
        case "click":
          self.element.unbind("click." + pluginName);
          break;
        case "otherClick":
          self.element.unbind("click." + pluginName);
          $(document).unbind("click." + pluginName + self.id);
          break;
        case "hover":
          self.unbind("mouseenter." + pluginName + " mouseleave." + pluginName)
          break;
      };
      self.removeTag();
    };
    public_.play = function () {      
      if (!timer && self.options.position) {
        timer = setInterval(function () {
          self && self.refresh("reWidth,reArrow")
        }, 300)
      }
    };
    public_.stop = function () {
      if (timer) {
        clearInterval(timer);
        timer = null
      };
      return self;
    };
    public_.refresh = function (notString) {
      if (!self.element.data('plugin_' + pluginName)) {
        self.removeTag();
        return false
      };
      if (!/\breWidth\b/.test(notString)) self.resize.reWidth();
      if (!/\breArrow\b/.test(notString)) self.resize.reArrow();
      if (!/\breTag\b/.test(notString)) self.resize.reTag();
      if (!/\bvisibleOrHidden\b/.test(notString)) self.visibleOrHidden();
      return self;
    };
    public_.iswindowBorder = function (func) {
      var pad = 3,
        A, B,
        offsetLeft = self.helper.offset().left,
        offsetTop = self.helper.offset().top,
        scrollTop = $(document).scrollTop(),
        scrollLeft = $(document).scrollLeft(),
        windowWidth = $(window).width(),
        windowHeight = $(window).height(),
        data = {
          top: false,
          right: false,
          bottom: false,
          left: false,
          width: self.helper.outerWidth(),
          height: self.helper.outerHeight()
        };

      A = offsetTop - pad;
      B = scrollTop;
      A < B && (data.top = B - A);

      A = offsetLeft + data.width + pad;
      B = scrollLeft + windowWidth;
      A > B && (data.right = A - B);

      A = offsetTop + data.height + pad;
      B = scrollTop + windowHeight;
      A > B && (data.bottom = A - B);

      A = offsetLeft - pad;
      B = scrollLeft;
      A < B && (data.left = B - A);

      func && func.call(self, data);
    };
    private_.init = function () {
      $.each(["face", "title:content", "zIndex", "top"], function (i, n) {
        var A = n.split(":");
        if (A.length > 1) {
          self.element.attr("data-" + A[0]) && (self.options[A[1]] = self.element.attr("data-" + A[0]));
        } else {
          self.element.attr("data-" + n) && (self.options[n] = self.element.attr("data-" + n));
        }
      });
      self.top = self.options.top;

      if (typeof self.options.zIndex == "string" && self.options.zIndex.search("auto") > -1) {
        var getval = self.options.zIndex.split(","),
          A = 0,
          B = 100;
        self.element.parents().each(function () {
          var getindex = parseInt($(this).css("z-index"));
          if (A < getindex) A = getindex;
        });
        self.options.zIndex = A + B + Groups.A.length + 1 + parseInt(getval[1] || 0);
      };

      self.createElement.init();
      self.element.data('plugin_' + pluginName, self);
      Groups.addto(self);
      self.options.timeout && (self.timeout = setTimeout(function () {
        self.options.cache ? self.hide() : self.removeTag()
      }, self.options.timeout));
      self.options.callback.init.call(this);
    };

    private_.createElement = {
      init: function () {
        this.createCss();
        self.options.position ? this.createBox() : this.createBoxForTag();
        self.options.aSize && this.createArrow();
        self.options.close && this.createClose();
        self.options.loading && this.createLoading();
        self.helper.data('plugin_' + pluginName, self.element);
      },
      createBox: function () {
        self.helper = $("<div class='" + classname + "-k'></div>").css($.extend(self.options.css, {
          "z-index": self.options.zIndex
        })).appendTo("body");
        self.$content = $("<div>" + self.options.content + "</div>").appendTo(self.helper);
      },
      createBoxForTag: function () {
        self.warp = self.element.wrap($("<div class='" + classname + "-wrap'>")).parent();
        self.helper = $("<div class='" + classname + "-k'></div>").css($.extend(self.options.css, {
          "z-index": self.options.zIndex
        })).appendTo(self.warp);
        self.$content = $("<span>" + self.options.content + "</span>").appendTo(self.helper);
      },
      createClose: function () {
        self.helper.css("padding-right", parseInt(self.helper.css("padding-right")) + 8);
        self.closex = $("<span class='js-close'>×</span>").appendTo(self.helper).css({
          "font-size": self.options.css.closeSize
        });
        self.closex.bind("click." + pluginName, function () {
          self && self.hide();
        });
      },
      createArrow: function () {
        if (self.arrow || !self.options.aSize || self.options.aSize <= 2 || $.isEmptyObject(self.options.css)) return;
        self.arrow = $("<div class='" + classname + "-arrow'><i></i><i class='" + classname + "-a1'></i></div>").appendTo(self.helper);
      },
      createLoading: function () {
        self.$loading = $("<div class='" + classname + "-loading'>").appendTo(self.helper);
        if (self.options.loading == true) {
          self.$loading.html("加载中...");
        } else if (self.options.loading.search(".gif") > -1) {
          self.$loading.css("background-image", "url(" + self.options.loading + ")");
        } else {
          self.$loading.html(self.options.loading);
        };
      },
      createCss: function () {
        if ($("style[data-title=" + classname + "-style]").length > 0) return;
        var options = self.options.css,
          css = "." + classname + "-k{ position:absolute; display:none; min-width:" + parseInt(self.options.minWidth) + "px; min-height:" + parseInt(self.options.minHeight) + "px}" + "." + classname + "-wrap{ position:relative; display:inline-block; *display:inline *zoom:1}" + "." + classname + "-k .js-close{ font-family:Verdana; position:absolute; z-index:3; top:-5px; right:2px; cursor:pointer}" + "." + classname + "-arrow{position:absolute}" + "." + classname + "-arrow i{display:block; border-style:solid; width:0px; height:0px; overflow:hidden; position:relative; _position:absolute; z-index:2}" + "." + classname + "-arrow ." + classname + "-a1{position:absolute; z-index:1;}" + "." + classname + "-loading{position:absolute; left:50%; top:50%; width:130px; text-align:center; padding:30px 0px; background-position:center center; background-repeat:no-repeat; display:none}";
        $("head:first").append("<style data-title='" + classname + "-style'>" + css + "</style>");
      }
    };

    private_.resize = {
      reWidth: function () {
        self.helper.width("auto").height("auto");
        if (typeof self.options.width == "string" && self.options.width.search("limit") > -1) {
          var getval = self.options.width.split(","),
            w = self.helper.innerWidth() - parseInt(self.helper.css("padding-left")) - parseInt(self.helper.css("padding-right"));
          self.helper.width(w + parseInt(getval[1] || 0));
        } else {
          self.helper.width(self.options.width);
        };

        self.options.height && self.options.height !== "auto" && self.helper.height(self.options.height);
        return self;
      },
      reTag: function () {
        if (!self.element) return;
        var pd = 0,
          x = 0,
          y = 0,
          aSize = parseInt(self.options.aSize);
        if (self.options.position) {
          x = self.element.offset().left;
          y = self.element.offset().top;
        } else {
          x = parseInt(self.element.css("margin-left"));
          y = parseInt(self.element.css("margin-top"));
        };
        switch (self.options.face) {
          case "top":
            x = x + self.left - self.alocLeft + aSize;
            y = y - self.helper.outerHeight() + parseInt(self.top) - aSize - pd;
            break;
          case "right":
            x = x + self.element.outerWidth() + aSize + self.left + pd;
            y = y + parseInt(self.top) - self.alocLeft + aSize;
            break;
          case "bottom":
            x = x + self.left - self.alocLeft + aSize;
            y = y + self.element.outerHeight() + parseInt(self.top) + aSize + pd;
            break;
          case "left":
            x = x - self.helper.outerWidth() - aSize + self.left - pd;
            y = y + parseInt(self.top) - self.alocLeft + aSize;
            break;
        };
        self.helper.css({
          left: x,
          top: y
        });
        return self;
      },
      reArrow: function () {
        if (!self.arrow) return self;
        self.arrow.removeAttr("style");
        self.left = self.options.left;
        self.top = self.options.top;
        var face = self.options.face,
          aSize = parseInt(self.options.aSize),
          a1 = self.arrow.find("i:eq(0)").removeAttr("style"),
          a2 = self.arrow.find("i:eq(1)").removeAttr("style"),
          aw = parseInt(self.helper.css("borderLeftWidth"));

        var getaloc = String(self.options.aLoc).split(","),
          add = parseInt(getaloc[1] || 0);
        switch (getaloc[0]) {
          case "left":
            self.alocLeft = ((face == "top" || face == "bottom") && 5 || 3) + add;
            if (face == "top" || face == "bottom") {
              self.left += add;
            } else {
              self.top += add;
            };
            break;
          case "center":
            if (face == "top" || face == "bottom") {
              self.alocLeft = self.helper.innerWidth() / 2 - aSize + add;
              self.left += (self.element.innerWidth() / 2 - aSize * 2 + parseInt(self.options.left) + add);
            } else {
              self.alocLeft = self.helper.innerHeight() / 2 - aSize + add;
              self.top += (self.element.innerHeight() / 2 - aSize * 2 + parseInt(self.options.top) + add);
            };
            break;
          case "right":
            if (face == "top" || face == "bottom") {
              self.alocLeft = self.helper.innerWidth() - aSize * 2 - 5 + add;
              self.left = (self.element.innerWidth() - aSize * 2 - 5 + parseInt(self.options.left) + add);
            } else {
              self.alocLeft = self.helper.innerHeight() - aSize - 8 + add;
              self.top += (self.element.innerHeight() - aSize * 2 - 8 - parseInt(self.options.top) + add);
            };
            break;
          case "auto":
            self.alocLeft = (face == "top" || face == "bottom") && 5 || 3;
            break;
          default:
            self.alocLeft = parseInt(self.options.aLoc);
        };

        switch (face) {
          case "top":
            self.arrow.css({
              bottom: -(aSize * 2),
              left: self.alocLeft,
              height: aSize * 2 + aw
            });
            a1.css({
              "border-color": self.helper.css("background-color") + " transparent transparent transparent"
            });
            a2.css({
              top: aw,
              "border-color": self.helper.css("borderLeftColor") + " transparent transparent transparent"
            });
            IE6() && a1.add(a2).css({
              "border-style": "solid dashed dashed dashed"
            });
            break;
          case "right":
            self.arrow.css({
              left: -(aSize * 2),
              top: self.alocLeft
            });
            a1.css({
              "border-color": "transparent " + self.helper.css("background-color") + " transparent transparent"
            });
            a2.css({
              top: 0,
              left: -aw,
              "border-color": "transparent " + self.helper.css("borderLeftColor") + " transparent transparent"
            });
            IE6() && a1.add(a2).css({
              "border-style": "dashed solid dashed dashed"
            });
            break;
          case "bottom":
            self.arrow.css({
              top: -(aSize * 2),
              left: self.alocLeft
            });
            a1.css({
              "border-color": "transparent transparent " + self.helper.css("background-color") + " transparent"
            });
            a2.css({
              top: -aw,
              "border-color": "transparent transparent " + self.helper.css("borderLeftColor") + " transparent"
            });
            IE6() && a1.add(a2).css({
              "border-style": "dashed dashed solid dashed"
            });
            break;
          case "left":
            self.arrow.css({
              right: -(aSize * 2),
              top: self.alocLeft
            });
            a1.css({
              "border-color": "transparent transparent transparent " + self.helper.css("background-color")
            });
            a2.css({
              top: 0,
              right: -aw,
              "border-color": "transparent transparent transparent " + self.helper.css("borderLeftColor")
            });
            if (IE6()) {
              a1.add(a2).css({
                "border-style": "dashed dashed dashed solid"
              });
              self.arrow.css({
                right: -(parseInt(self.options.aSize) * 2),
                top: self.alocLeft
              });
              a1.css({
                top: 0,
                right: 1
              });
            };
            break;
        };
        a1.add(a2).css({
          "border-width": aSize
        });
        return self;
      },
      reLoading: function () {
        self.$loading.css({
          "margin-left": -self.$loading.innerWidth() / 2,
          "margin-top": -self.$loading.innerHeight() / 2
        })
      }
    };

    private_.visibleOrHidden = function () {
      if (!self.element) return;
      if (self.element.is(":visible") && self.visible) {
        self.helper.show();
      } else if (self.element.is(":hidden")) {
        self.helper.hide();
      };
    };
    this.init();
  };

  var Groups = {
    A: [],
    _timer: null,
    addto: function (self) {
      this.A.push(self)
    },
    remove: function (self) {
      for (var i = 0; i < this.A.length; i++) this.A[i].id == self.id && this.A.splice(i, 1);
    }
  };

  $.fn[pluginName] = function (options) {
    options = options || {};
    if (typeof options == 'string') {
      var args = arguments,
        method = options;
      Array.prototype.shift.call(args);
      switch (method) {
        case "getClass":
          return $(this).data('plugin_' + pluginName);
        default:
          return this.each(function () {
            var plugin = $(this).data('plugin_' + pluginName);
            if (plugin && plugin[method]) plugin[method].apply(plugin, args);
          });
      };
    } else {
      return this.each(function () {
        var org = $.extend(true, {}, defaults, options);;

        var plugin = $(this).data('plugin_' + pluginName);
        plugin && plugin.destroy();

        switch (org.act) {
          case "click":
            $(this).bind("click." + pluginName, function () {
              var plugin = $(this).data('plugin_' + pluginName);
              plugin ? plugin.show() : new Plugin($(this), options).show();
            });
            break;
          case "otherClick":
            $(this).bind("click." + pluginName, function (event) {
              var plugin = $(this).data('plugin_' + pluginName);
              if (plugin) {
                plugin.show();
              } else {
                plugin = new Plugin($(this), options).show();
                $(document).bind("click." + pluginName + plugin.id, function (event) {
                  if (plugin &&
                    plugin.helper.has(event.target).length == 0 &&
                    plugin.helper[0] != event.target &&
                    plugin.element[0] != event.target) {
                    plugin.hide();
                  };
                });
              };
            });
            break;
          case "hover":
            var _in, _out;
            $(this).bind("mouseenter." + pluginName, function () {
              var self = $(this),
                plugin = self.data('plugin_' + pluginName);
              clearTimeout(_out);
              _in = setTimeout(function () {
                if (plugin) {
                  plugin.show();
                } else {
                  plugin = new Plugin(self, options).show();
                  plugin.helper.hover(function () {
                    clearTimeout(_out);
                  }, function () {
                    var plugin = $.alertTs.parent($(this));
                    if (!plugin) return;
                    _out = setTimeout(function () {
                      plugin.hide()
                    }, org.delay);
                  });
                }
              }, org.delay);
            }).bind("mouseleave." + pluginName, function () {
              clearTimeout(_in);
              var plugin = $(this).data('plugin_' + pluginName);
              if (!plugin) return;
              _out = setTimeout(function () {
                plugin && plugin.hide()
              }, org.delay * 1.5);
            });
            break;
          default:
            new Plugin($(this), options).show();
        };
      }); //end each
    };
  };

  $[pluginName] = {
    id: 0,
    setup: function (options) {
      return $.extend(defaults, options)
    },
    resetzIndex: function (element, level, callback) {
      level = level || 1;
      level = parseInt(element.length + level);
      element.each(function () {
        callback && callback.call($(this), --level);
        $(this).css("z-index", --level);
      });
    },
    cssStyle: function (options) {
      return $.extend(true, colorStyle, options);
    },
    parent: function (element) {
      return element.closest("." + classname + "-k").data("plugin_" + pluginName).data("plugin_" + pluginName);
    },
    error: function (id, msg, options, func) {
      var org = {
        content: msg,
        cssStyle: "red",
        callback: {}
      };
      if (options && $.isPlainObject(options)) {
        $.extend(true, org, options);
      } else if (options && typeof options == "function") {
        org.callback.show = options;
      };
      (func && typeof func == "function") && (org.callback.show = func);
      id[pluginName](org);
    },
    title: function (id, msg, options, func) {
      var org = {
        content: msg,
        cssStyle: "yellow",
        callback: {}
      };
      if (options && $.isPlainObject(options)) {
        $.extend(true, org, options);
      } else if (options && typeof options == "function") {
        org.callback.show = options;
      };
      (func && typeof func == "function") && (org.callback.show = func);
      id[pluginName](org);
    }
  };

  function IE6() {
    return (/msie\s*(\d+)\.\d+/g.exec(navigator.userAgent.toLowerCase()) || [0, "0"])[1] == "6"
  };
})(jQuery, window);

$.alertTs.cssStyle({
  red: {
    "border-width": "1px",
    "border-color": "#efd7ad",
    "border-style": "solid",
    "border-radius": "0px",
    "background-color": "#fffaf1",
    "box-shadow": "1px 1px 2px rgba(0,0,0,0.1)",
    "color": "#666",
    "padding": "3px 10px",
    "font-size": "12px",
    "line-height": "20px",
    "closeColor": "#cc0000",
    "closeSize": "12px"
  },
  yellow: {
    "border-width": "1px",
    "border-color": "#cbccc4",
    "border-style": "solid",
    "border-radius": "4px",
    "background-color": "#ffffe3",
    "box-shadow": "1px 1px 2px rgba(0,0,0,0.1)",
    "color": "#354674",
    "padding": "3px 10px",
    "font-size": "12px",
    "line-height": "20px",
    "closeColor": "#cc0000",
    "closeSize": "12px"
  },
  blue: {
    "border-width": "1px",
    "border-color": "#dcdbdb",
    "border-style": "solid",
    "border-radius": "4px",
    "background-color": "#f0f8ff",
    "box-shadow": "1px 1px 2px rgba(0,0,0,0.1)",
    "color": "#5e92b8",
    "padding": "6px 10px",
    "font-size": "12px",
    "line-height": "20px",
    "closeColor": "#cc0000",
    "closeSize": "12px"
  },
  none: {}
});
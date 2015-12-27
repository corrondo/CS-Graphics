pc.script.create('menu', function (app) {
	// Creates a new Menu instance
	var Menu = function (entity) {
		this.entity = entity;
		this.css = "";
		this.html = "";
		$navOption = 0;
		$navSlider = 0;
		$nav = 0;
		$logo = 0;
		$icon = 0;
		$containers = 0;
		this.navOpen = false;
		this.cubeScript = 0;
		isTouchDevice = 'ontouchstart' in document.documentElement;
		menu = this;		// Fallback for when "this" in scope points to JQuery object

	};

	Menu.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function () {
			this.createCSS();
			this.createHTML();
			$navOption		= $(".option").on("mouseover", this.optionOver).on("mouseout", this.optionOut).on("click", this.optionClick);
			$navSlider		= $("#slider");
			$nav			= $("nav");
			$logo			= $("#logo");
			$icon			= $("#icon-but").hover(this.iconHover).on("click", this.iconClick);
			$containers	= $(".container");
			this.cubeScript = app.root.findByName("Cube").script.cube;

			this.showNav();
		},

		// Called every frame, dt is time in seconds since last update
		update: function (dt) {
		},

		createCSS: function(){
			this.css = function() {/*
				@import url(http://fonts.googleapis.com/css?family=Exo+2:400,100);
				a{
					color: #ff0000;
					text-decoration: none;
				}
				a:hover{
					text-decoration: underline;
				}
				nav{
					color: #ffff00;
					font-family: "Exo 2", sans-serif;
					font-weight: 100;
					font-size: 40px;
					border-left: 1px solid #fff;
					position: absolute;
					top: 100px;
					left: 30px;
					background: rgba(0,0,0,0.1);
					width: 300px;
					height: 0px;
					overflow: hidden;
					padding-left: 20px;
				}
				.container{
					position: absolute;
					top: 0px;
					left: 20px;
					width: 230px;
					padding-top: 90px;
				}
				#container2{
					left: -250px;
				}
				#slider{
					position: absolute;
					top: -30px;
					left: 0px;
					width: 2px;
					height: 30px;
					display: block;
					background: #fff;
				}
				#logo{
					background: center center / 100% auto no-repeat;
					width: 237px;
					height: 107px;
					margin-left: -270px;
				}
				.subheader{
					color: #0000ff;
					font-weight: 400;
					font-size: 22px;
					width: 250px;
					border-bottom: 1px solid #222;
					margin-top: 20px;
					white-space: nowrap;
					overflow: hidden;
				}
				.option{
					line-height: 60px;
					cursor: pointer;
					text-transform: uppercase;
					height: 60px;
					width: 230px;
					margin-left: -270px;
				}
				.option.active,
				.option.active:hover{
					color: #09f;
				}
				.option.inactive,
				.option.inactive:hover{
					color: #444;
				}
				.option:hover{
					color: #fff;
				}
				#icon-but{
					position: absolute;
					top: 30px;
					left: 30px;
					width: 40px;
					height: 40px;
					cursor: pointer;
					display: none;
				}
				.icon-div{
					display: block;
					position: absolute;
					top: 0px;
					left: 0px;
					width: 100%;
					height: 100%;
				}
				#outer{
					background: bottom left / auto 200% no-repeat;
				}
				#inner{
					background: top left / auto 200% no-repeat;
					transform: scale(0);
				}
				.copy{
					font-size: 24px;
					font-weight: 400;
				}
				@media (max-height: 700px){
					nav{
						transform: scale(0.5);
						-webkit-transform: scale(0.5);
						transform-origin: 0 0;
						-webkit-transform-origin: 0 0;
						top: 5px;
						left: 5px;
					}
					#icon-but{
						top: 5px;
						left: 5px;
					}
				}
			*/};
			this.css = this.css.toString().trim();
			this.css = this.css.slice(this.css.indexOf('/*') + 2).slice(0, -3);
			this.css += "#logo{background-image: url(" + app.assets.find("img-logo").getFileUrl() + ");}";
			this.css += "#outer,#inner{background-image: url(" + app.assets.find("img-icon").getFileUrl() + ");}";
			
			var style = document.createElement('style');
			style.innerHTML = this.css;
			document.querySelector('head').appendChild(style);
		},

		createHTML: function(){
			this.html = function(){/*
				<nav>
					<div id="slider"></div>
					<div id="logo"></div>
					<div class="container" id="container1">
						<div class="subheader">Modes</div>
						<div id="nav-0" class="option">Shuffle</div>
						<div id="nav-1" class="option">Play</div>
						<div id="nav-2" class="option inactive">Timed</div>              
						<div id="nav-3" class="option inactive">Learn</div>
						<div class="subheader">Options:</div>
						<div id="nav-4" class="option">Mute</div>
						<div id="nav-5" class="option">About</div>
					</div>
					<div class="container" id="container2">
						<div class="subheader">About</div>
						<div class="copy">
							<p>Created by Federico Watkins based on Marco Del Valle's Roobix.<br></p>

							<p>madRoobix is a school assignment design to demonstrate comprehension of code.</p>
						
							
						</div>
						<div class="subheader"></div>
						<div id="nav-6" class="option">Back</div>
					</div>
				</nav>
				<div id="icon-but">
					<div class="icon-div" id="outer"></div>
					<div class="icon-div" id="inner"></div>
				</div>
			*/};
			this.html = this.html.toString().trim();
			this.html = this.html.slice(this.html.indexOf('/*') + 2).slice(0, -3);
			$("body").append(this.html);
		},

		optionOver:function(){
			if(!menu.navOpen || isTouchDevice){return false;}
			TweenMax.to($navSlider, 0.3, {top: $(this).position().top + 16, left:"0px", ease: Power2.easeInOut});
			TweenMax.to($(this), 0.3, {paddingLeft: "5px", ease: Power2.easeOut});
		},

		optionOut:function(){
			if(!menu.navOpen){return false;}
			TweenMax.to($navSlider, 0.3, {left: "-2px"});
			TweenMax.to($(this), 0.3, {paddingLeft: "0px", ease: Power2.easeIn});
			var hoverID = $navOption.index(this);

			switch(hoverID){
				case 2:
					$(this).css({color: ""});
				break;
				case 3:
					$(this).css({color: ""});
				break;
			}
		},

		optionClick:function(){
			if(!menu.navOpen){return false;}
			var clickID = $navOption.index(this);
			switch(clickID){
				case 0:		// Shuffle
					$(this).addClass("active");
					menu.cubeScript.startShuffle();
					menu.hideNav();
				break;
				case 1:		// Free play
					$(this).addClass("active");
					menu.cubeScript.status = "";
					menu.hideNav();
				break;
				case 2:		// Timed
				case 3:		// Tutorial
					return false;
				break;
				case 4:
					menu.toggleMute();
				break;
				case 5:
					$(this).toggleClass("active");
					menu.showContainer(1);
				break;
				case 6:
					$(this).toggleClass("active");
					menu.showContainer(0);
				break;
			}
		},

		showContainer:function(id){
			TweenMax.to($containers, 0.5, {left: "-250px", ease: Power2.easeIn, onComplete: function(){
				menu.resetActiveOptions();
			}});
			TweenMax.to($containers[id], 0.5, {left: "20px", ease: Power2.easeOut, delay: 0.7});
		},

		iconHover:function(ev){
			if(menu.navOpen){return false;}
			if(ev.type === "mouseenter"){
				TweenMax.to($(this).find("#inner"), 0.3, {scale: 1, ease: Power2.easeOut});
				TweenMax.to($(this).find("#outer"), 0.3, {scale: 2, alpha: 0, ease: Power2.easeIn});
			}
			else if(ev.type === "mouseleave"){
				TweenMax.to($(this).find("#inner"), 0.3, {scale: 0, ease: Power2.easeIn});
				TweenMax.to($(this).find("#outer"), 0.3, {scale: 1, alpha: 1, ease: Power2.easeOut});
			}
		},

		iconClick:function(){
			TweenMax.to($(this), 0.3, {scale: 2, alpha: 0, display: "none", ease: Power2.easeOut, onComplete: function(){
				menu.showNav();
			}});
			menu.navOpen = true;
		},

		iconShow:function(){
			TweenMax.set($icon.find("#inner"), {scale: 0});
			TweenMax.set($icon.find("#outer"), {scale: 1, alpha: 1});
			TweenMax.set($icon, {scale: 2, alpha: 0});
			TweenMax.to($icon, 0.3, {scale: 1, alpha: 1, display: "block", ease: Power2.easeOut});
		},

		hideNav:function(){
			TweenMax.staggerTo($navOption, 0.5, 	{marginLeft: "-270px", ease: Power4.easeIn}, -0.05);
			TweenMax.to($logo, 0.5, 				{marginLeft: "-270px", ease: Power4.easeIn, delay: 0.6});
			TweenMax.to($nav, 1, {height: "0px", ease: Power4.easeInOut, delay: 0.5, onComplete: function(){
				menu.iconShow();
				menu.resetActiveOptions();
				TweenMax.set($navSlider, {top:"-30px"});
			}});
			menu.navOpen = false;
		},

		showNav:function(){
			TweenMax.to($nav, 1, {height: "600px", ease: Power4.easeInOut});
			TweenMax.staggerTo($navOption, 1, 	{marginLeft: "0px", ease: Power4.easeOut, delay: 0.4}, 0.1);
			TweenMax.to($logo, 1, 				{marginLeft: "0px", ease: Power4.easeOut, delay: 0.4});
			menu.navOpen = true;
		},

		resetActiveOptions:function(){	
			$navOption.each(function(index){
				TweenMax.set($(this), {paddingLeft: "0px"});
				if(index !== 4){
					$(this).removeClass("active");
				}
			});
		},

		toggleMute:function(status){
			$navOption.eq(4).toggleClass("active");
			if($navOption.eq(4).hasClass("active")){
				$navOption.eq(4).html("Muted");
				menu.cubeScript.mute = true;
			}else{
				$navOption.eq(4).html("Mute");
				menu.cubeScript.mute = false;
			}
		}
	};

	return Menu;
});
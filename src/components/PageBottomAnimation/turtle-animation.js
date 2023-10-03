export function initTurtleAnimation(canvas, audio, extensionCount) {
  if (!canvas || !audio) { return }

  const flip = false;
  const mouse = {x: 0, y: 0}
  const turtlePixels = new Uint8Array(4);

  let audioCtx, analyser, bufferLength, dataArray, mouseOver;
  function init_audio() {
    if(extensionCount.current != 7) return;
    if(audioCtx) {
      if(audio.paused) audio.play()
      else audio.pause()
      return
    }
    audio.loop = true;
    audioCtx = new AudioContext();

    const source = audioCtx.createMediaElementSource(audio);
    var panner = audioCtx.createPanner();
    source.connect(panner);
    analyser = audioCtx.createAnalyser();
    panner.connect(analyser)
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 1024;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    audio.src = "/sounds/best-time-112194.mp3"
    audio.play()
  }

  const output_canvas = canvas;
  const base_canvas = document.createElement('canvas')
  function init_base_image() {
    const canvas = base_canvas;
    canvas.width = document.body.clientWidth
    canvas.height = innerHeight

    const gl = canvas.getContext("webgl",
      {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
      });

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);

    const vertexShaderSource = `
    precision lowp float;

    attribute vec2 a_position;
    varying vec2 v_position;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_position = a_position;
    }
    `
    gl.shaderSource(
      vertexShader,
      vertexShaderSource
    );
    gl.compileShader(vertexShader);


    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      let report = "Vertex Shader Error:\n\n";
      report += gl.getShaderInfoLog(vertexShader);
      report += "Vertex Shader Code:\n\n";
      report += vertexShaderSource.split('\n').reduce(function (sum, line, index) {
        return sum + (index + 1) + ":\t" + line + "\n";
      }, "");
      console.log(report)
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    const fragmentShaderSource = `
    precision lowp float;
    varying vec2 v_position;
    uniform float u_time;
    uniform float u_beat;
    uniform float u_pointer;
    uniform float u_scroll;
    uniform float u_playing;
    uniform vec2 u_size;
    uniform sampler2D u_texture_debris_a;
    uniform sampler2D u_texture_debris_b;
    uniform sampler2D u_texture_debris_c;
    uniform sampler2D u_texture_back;

    #define PI 3.14159265359
    #define E 2.7182818284
    #define GR 1.61803398875

    #define MIN_WIDTH (1./max(u_size.x,u_size.y))
    #define time ((saw(float(__LINE__)/GR)+1.0)*(u_time/E+1234.4321))
    #define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)
    #define saw(x) fract( sign( 1.- mod( abs(x), 2.) ) * abs(x) )

    const vec2 s = vec2(1, 1.7320508);

    vec4 hexagonal(vec2 p)
    {    
      vec4 hC = floor(vec4(p, p - vec2(.5, 1))/s.xyxy) + .5;
      vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) 
      ? vec4(h.xy, hC.xy) 
      : vec4(h.zw, hC.zw + .5);
    }
    float hexedge(in vec2 p)
    {    
      p = abs(p);
      return max(dot(p, s*.5), p.x); // Hexagon.
    }

    vec4 fractal(vec2 uv, float seed, float is_shell, float is_head, float is_fin)
    {
      vec4 hex = hexagonal(uv*5.);
      vec2 hex_uv = hex.xy*GR;
      float edge = smoothstep(0.025, .25, pow(1.-hexedge(hex_uv), 1.5));
      return vec4(flux(
        (1.-is_fin)
        *((321.123+hex.z)*123.321+(123.321+hex.w)*321.123)
        +seed
        +length(hex.xy)*PI*E*(1.+(is_shell-is_head)*PI)
        -time*(1.+PI*is_shell)+
        -u_beat*GR*PI*E), 1.);
    }

    mat2 rot(float x) {
      return mat2(cos(x), sin(x), -sin(x), cos(x));
    }
    vec3 fissure(vec2 p) {
      vec2 uv = p;
      uv.y = -uv.y+u_scroll+1.5;
      // uv.y += (.5-cos(time/PI)*.5)*10.;
      float below = sign(uv.y)*.5+.5;


      uv.x = (uv.x*2.-1.)*u_size.x/u_size.y*.5+.5;
      vec2 uv0 = uv;
      float scroll = uv.y*uv.y/4.;
      uv.x = uv.x*2.-1.+saw(uv.y+saw(uv.y*GR*E))/10.;
      float crack_right = 0.;
      float crack_left = 0.;
      
      const int max_i = 4;
      for(int i = 0; i < max_i; i++) {
        float iter = 1.+float(i+1)/float(max_i);
        crack_right += clamp(scroll*(scroll)*(scroll)/64.,0., 4.)*(.5+.5*saw(saw(iter*scroll/GR+1./E)/E+iter*scroll/E));
        iter = 2.-iter;
        crack_left -= clamp(scroll*(scroll)*(scroll)/64.,0., 4.)*(.5+.5*saw(.5+saw(.5+iter*scroll*GR+1./GR)/GR+iter*scroll/GR));
      }
    
      float noise_left = crack_left/float(max_i);
      float noise_right = crack_right/float(max_i);
      float color = 1.-(max(-sign(uv.x-noise_left)*.5+.5, sign(uv.x-noise_right)*.5+.5));
      uv0.y = p.y-min(-6.+u_scroll, 0.);
      return vec3(uv0, color*below);
    }


    vec2 hash(vec2 uv) {
      mat2 m = mat2(2114.2, 1241.6, -9818.559, -33.8);
      return fract((m * sin((m * uv))));
    }
    vec4 rocks(vec2 uv) {
      float min_y = 2.5;
      float max_y = 6.5;
      uv.y = (uv.y-min_y)/(max_y-min_y);
      vec2 uv1 = clamp(vec2(uv.x, uv.y*3.), vec2(0.), vec2(1.));
      vec2 uv2 = clamp(vec2(uv.x, uv.y*3.-.5), vec2(0.), vec2(1.));
      vec2 uv3 = clamp(vec2(uv.x, uv.y*3.-.1), vec2(0.), vec2(1.));
      vec4 color = texture2D(u_texture_debris_a, uv1);
      color += texture2D(u_texture_debris_b, uv2);
      color += texture2D(u_texture_debris_c, uv3);
      return color;//*(1.-smoothstep(min_y, max_y, uv.y));
    }

    // GT0 - Greater Than Zero
    float gt0(float value) {
      return clamp(sign(value), 0., 1.);
    }

    void main()
    {
      vec2 p0 = v_position.xy*.5+.5;
      vec4 crack = vec4(fissure(p0),1.);
      // gl_FragColor = saw(crack); gl_FragColor.a = 1.; return; //For debugging scrolling.
      float swim = time*PI;
      vec2 uv = crack.xy;

      uv = uv*2.-1.;

      if(u_size.y > u_size.x) uv.xy = uv.yx;

      uv.xy = uv.yx*(E)*max(1., u_size.y/u_size.x)/(1.+u_beat);
      uv.x *= GR;
      // uv.x *= max(1., u_size.y/u_size.x);
      // uv.x *= u_size.x/u_size.y*E;
      // uv.y *= GR;  
      vec2 uv0 = uv;
      vec2 uv2 = uv+vec2(0., -1./1.25);
      uv2 *= E;
      float shell = sqrt(clamp(1.-length(uv), 0., 1.));
      float shell_border = 1.-gt0(shell);
      vec2 head_uv = vec2(1.25, 1./1.25)*uv2;
      float eyes = sqrt(clamp(1.-length(PI*GR*E*vec2(abs(uv.x)*2.-1./PI, head_uv.y-1./E)), 0., 1.));
      float head = sqrt(clamp(1.-length(head_uv), 0., 1.));
      float neck = gt0(1.-length(uv2/vec2(GR, 1.)));
      shell *= (1.-neck);
      head *= max(neck, sign(head_uv.y));
      vec2 final_uv = vec2((uv.x), uv.y)*shell+head*vec2(saw(head_uv.x/E)*2.-1., head_uv.y)/E;

      vec2 uv_fin = vec2(1., sign(uv.y))*(abs(uv)-vec2(1./1.125, 1./1.5));
      uv_fin *= vec2(GR, E);
      uv_fin = (uv_fin+vec2(.5, 0.))*rot(sign(uv.y)*sign(uv.x)*sin(swim+sign(uv.x)+sign(uv.y))/E)+vec2(-.5, 0.);
      float fin = sqrt(clamp(1.-length(uv_fin), 0., 1.))*shell_border;
      fin *= 1.-gt0(uv_fin.y+uv_fin.x*uv_fin.x);
      final_uv += uv_fin*fin*(1.-shell);

      float foreground = smoothstep(0., .1, shell+fin+head);
      float is_head = gt0(head);
      float seed = gt0(head)+gt0(shell)*2.+gt0(fin)*4.*(sign(uv.x)+sign(uv.y))+gt0(eyes)*8.;
      vec4 pattern = fractal(final_uv, seed, gt0(shell), is_head, gt0(fin));
      vec4 rock = rocks(vec2(p0.x, crack.y));
      gl_FragColor = clamp(vec4(1.-rock.rgb, smoothstep(.5, .6, rock.a))+crack.z, vec4(0.),vec4(1.));
      gl_FragColor.rgb = rock.a*(1.-clamp(gl_FragColor.rgb, vec3(0.), vec3(1.)))+
      (1.+u_pointer/E)*(shell+fin+head)*(foreground*pattern.rgb);
      vec2 affine = vec2(p0.x, 1.-p0.y)*2.-1.;
      // affine.x *= MIN(1., u_size.y/u_size.x);
      affine += sin(vec2(time,
        time))*8./max(u_size.x, u_size.y);
      affine *= rot(time/PI);
      affine = saw(affine);
      vec4 back = texture2D(u_texture_back, affine)*
      (smoothstep(4.75, 5., -.5-v_position.y*.5+u_scroll))*u_playing;
      gl_FragColor += back*(1.-smoothstep(0., .1, length(gl_FragColor.rgb)))/(1.05);
    }
    `

    gl.shaderSource(
      fragmentShader,
      fragmentShaderSource
    );
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      let report = "Fragment Shader Error:\n\n";
      report += gl.getShaderInfoLog(fragmentShader);
      report += "\nFragment Shader Code:\n\n";
      report += fragmentShaderSource.split('\n').reduce(function (sum, line, index) {
        return sum + (index + 1) + ":\t" + line + "\n";
      }, "");
      console.log(report)
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

    const name = "a_position";
    const length = 2;
    const offset = 0;
    const stride = 2
    const attribLocation = gl.getAttribLocation(shaderProgram, name);
    gl.vertexAttribPointer(attribLocation, length, gl.FLOAT, false, stride * 4, offset * 4);
    gl.enableVertexAttribArray(attribLocation);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

    const NUM_INDICES = 6;

    // Create a centered & normalized bi-unit square:
    const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const timeUniformLocation = gl.getUniformLocation(shaderProgram, "u_time");
    const pointerUniformLocation = gl.getUniformLocation(shaderProgram, "u_pointer");
    const beatUniformLocation = gl.getUniformLocation(shaderProgram, "u_beat");
    const scrollUniformLocation = gl.getUniformLocation(shaderProgram, "u_scroll");
    const playingUniformLocation = gl.getUniformLocation(shaderProgram, "u_playing");
    const sizeUniformLocation = gl.getUniformLocation(shaderProgram, "u_size");

    const startTime = (window.performance || Date).now();
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const debris_uniforms = [
      gl.getUniformLocation(shaderProgram, "u_texture_debris_a"),
      gl.getUniformLocation(shaderProgram, "u_texture_debris_b"),
      gl.getUniformLocation(shaderProgram, "u_texture_debris_c")
    ]

    const buffer_texture_uniform = gl.getUniformLocation(shaderProgram, "u_texture_back")
    const buffer_texture = gl.createTexture();
    const debris_sources = ['/images/debris1.png', '/images/debris2.png', '/images/debris3.png']
    const debris_textures = debris_sources.map(() => gl.createTexture());
    const debris_images = debris_sources.map(() => document.createElement("img"))

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    let count = 0;
    const on_image_loaded = function (index) {
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, debris_textures[index]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, debris_images[index]);
      gl.uniform1i(debris_uniforms[index], index);
      count++
      if (count == debris_uniforms.length) frame();
    }

    debris_images.forEach(function (image, index) {
      image.onload = function () {
        on_image_loaded(index)
      }
      image.src = debris_sources[index]
    })

    function frame() {
      let beat = 0;
      if(audioCtx && analyser) {
        analyser.getByteTimeDomainData(dataArray);
        beat = Math.max(...dataArray)/255.
      }
      gl.uniform1f(beatUniformLocation, beat);
      gl.uniform1f(pointerUniformLocation, mouseOver ? 1 : 0)
      gl.uniform1f(playingUniformLocation, audio.paused ? 0: 1)
      canvas.width = document.body.clientWidth
      canvas.height = innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height);


      debris_textures.forEach(function (image, index) {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, debris_textures[index]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, debris_images[index]);
        gl.uniform1i(debris_uniforms[index], index);

      })
      gl.activeTexture(gl.TEXTURE0 + debris_textures.length);
      gl.bindTexture(gl.TEXTURE_2D, buffer_texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, canvas);
      gl.uniform1i(buffer_texture_uniform, debris_textures.length);
      

      gl.uniform1f(timeUniformLocation, ((window.performance || Date).now() - startTime) / 1000);
      gl.uniform2f(sizeUniformLocation, document.body.clientWidth
        , window.innerHeight);
      let scroll_offset = document.getElementById('grid-main').offsetHeight+
        document.getElementsByTagName('header')[0].offsetHeight
      scroll_offset = Math.max((window.scrollY-scroll_offset) / innerHeight, 0);
      gl.uniform1f(scrollUniformLocation, scroll_offset);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, NUM_INDICES, gl.UNSIGNED_SHORT, 0);
      gl.flush()
      gl.readPixels(mouse.x, window.innerHeight-mouse.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, turtlePixels);
      mouseOver = ((turtlePixels[0]+turtlePixels[1]+turtlePixels[2])*turtlePixels[3] > 0)
      output_canvas.style.cursor =  mouseOver ? 'pointer' : 'auto'
      requestAnimationFrame(frame);
    };
  }

  function init_glitch_image() {
    // NOTE: window.innerWidth doesn't account for the width of the scrollbar
    //       and leads to a bug where the unwanted horizontal scroll bar appears.
    canvas.width = document.body.clientWidth
    canvas.height = innerHeight

    const gl = canvas.getContext("webgl",
      {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
      });

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);

    const vertexShaderSource = `
    precision lowp float;

    attribute vec2 a_position;
    varying vec2 v_position;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_position = a_position;
    }
    `
    gl.shaderSource(
      vertexShader,
      vertexShaderSource
    );
    gl.compileShader(vertexShader);


    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      let report = "Vertex Shader Error:\n\n";
      report += gl.getShaderInfoLog(vertexShader);
      report += "Vertex Shader Code:\n\n";
      report += vertexShaderSource.split('\n').reduce(function (sum, line, index) {
        return sum + (index + 1) + ":\t" + line + "\n";
      }, "");
      console.log(report)
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    const fragmentShaderSource = `
    precision lowp float;
    varying vec2 v_position;
    uniform float u_time;
    uniform float u_scroll;
    uniform vec2 u_size;
    uniform sampler2D u_texture_back;

    #define PI 3.14159265359
    #define E 2.7182818284
    #define GR 1.61803398875

    #define time ((saw(float(__LINE__)/GR)+1.0)*(u_time/E+1234.4321))
    #define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)
    #define saw(x) fract( sign( 1.- mod( abs(x), 2.) ) * abs(x) )

    //2D (returns 0 - 1)
    float random2d(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float randomRange (in vec2 seed, in float min, in float max) {
      return min + random2d(seed) * (max - min);
    }

    // return 1 if v inside 1d range
    float insideRange(float v, float bottom, float top) {
      return step(bottom, v) - step(top, v);
    }

    //inputs
    const float AMT = 0.5; //0 - 1 glitch amount
    const float SPEED = 0.25; //0 - 1 speed
      
    vec4 glitch(vec2 uv)
    {
      //copy orig
      vec4 outCol = texture2D(u_texture_back, uv);
      
      //randomly offset slices horizontally
      float maxOffset = AMT/2.0;
      const float iterations = AMT * 10.;
      for (float i = 0.0; i < iterations; i += 1.0) {
        float sliceY = random2d(vec2(u_time , 2345.0 + float(i)));
        float sliceH = random2d(vec2(u_time , 9035.0 + float(i))) * 0.25;
        float hOffset = randomRange(vec2(u_time , 9625.0 + float(i)), -maxOffset, maxOffset);
        vec2 uvOff = uv;
        uvOff.x += hOffset;
        if (insideRange(uv.y, sliceY, fract(sliceY+sliceH)) == 1.0 ){
          outCol = texture2D(u_texture_back, uvOff);
        }
      }
      
      //do slight offset on one entire channel
      float maxColOffset = AMT/6.0;
      float rnd = random2d(vec2(u_time , 9545.0));
      vec2 colOffset = vec2(randomRange(vec2(u_time , 9545.0),-maxColOffset,maxColOffset), 
        randomRange(vec2(u_time , 7205.0),-maxColOffset,maxColOffset));
      if (rnd < 0.25){
          outCol.r = texture2D(u_texture_back, uv + colOffset).r;
          
      }else if (rnd < 0.5){
          outCol.g = texture2D(u_texture_back, uv + colOffset).g;
          
      }else if (rnd < 0.75){
        outCol.b = texture2D(u_texture_back, uv + colOffset).b;  
      } else{
        outCol.a = texture2D(u_texture_back, uv + colOffset).a;  
      }
      return outCol;
    }

    void main()
    {
      vec2 p0 = v_position.xy*.5+.5;
      p0.y = 1.-p0.y;
      float period = 10.;
      float duration = .25;
      float is_glitch = smoothstep(period-duration, period-duration*.75, fract(u_time/period)*period)*
        smoothstep(1., 2., -.5-v_position.y*.5+u_scroll)*
        (1.-smoothstep(4.75, 5., -.5-v_position.y*.5+u_scroll));
      gl_FragColor = texture2D(u_texture_back, p0)*(1.-is_glitch)+is_glitch*glitch(p0)-1./32.;
    }
    `

    gl.shaderSource(
      fragmentShader,
      fragmentShaderSource
    );
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      let report = "Fragment Shader Error:\n\n";
      report += gl.getShaderInfoLog(fragmentShader);
      report += "\nFragment Shader Code:\n\n";
      report += fragmentShaderSource.split('\n').reduce(function (sum, line, index) {
        return sum + (index + 1) + ":\t" + line + "\n";
      }, "");
      console.log(report)
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

    const name = "a_position";
    const length = 2;
    const offset = 0;
    const stride = 2
    const attribLocation = gl.getAttribLocation(shaderProgram, name);
    gl.vertexAttribPointer(attribLocation, length, gl.FLOAT, false, stride * 4, offset * 4);
    gl.enableVertexAttribArray(attribLocation);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

    const NUM_INDICES = 6;

    // Create a centered & normalized bi-unit square:
    const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const timeUniformLocation = gl.getUniformLocation(shaderProgram, "u_time");
    const scrollUniformLocation = gl.getUniformLocation(shaderProgram, "u_scroll");
    const sizeUniformLocation = gl.getUniformLocation(shaderProgram, "u_size");
    const textureUniformLocation = gl.getUniformLocation(shaderProgram, "u_texture_back");
    const startTime = (window.performance || Date).now();
    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const back_texture = gl.createTexture();

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    (function frame() {
      canvas.width = document.body.clientWidth
      canvas.height = innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height);
      const texNum = 0;

      gl.activeTexture(gl.TEXTURE0 + texNum);
      gl.bindTexture(gl.TEXTURE_2D, back_texture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, base_canvas);
      gl.uniform1i(textureUniformLocation, texNum);

      gl.uniform1f(timeUniformLocation, ((window.performance || Date).now() - startTime) / 1000);
      gl.uniform2f(sizeUniformLocation, document.body.clientWidth
        , window.innerHeight);
      const first_page_height = document.getElementById('grid-main').offsetHeight+
        document.getElementsByTagName('header')[0].offsetHeight
      const offset = Math.max((window.scrollY-first_page_height) / innerHeight, 0);
      gl.uniform1f(scrollUniformLocation, offset);
      if(audioCtx) audioCtx.listener.setPosition(0, Math.pow(offset-6, 2), 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, NUM_INDICES, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(frame);
    })();
  }

  init_base_image()
  init_glitch_image()
  canvas.onclick = init_audio
  canvas.onmousemove = (e)=>{
    mouse.x = e.x
    mouse.y = e.y
  }
}


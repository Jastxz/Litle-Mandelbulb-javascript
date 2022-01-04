/*
Este código está inspirado y ayudado por el código de los siguientes enlaces:
  - https://github.com/royvanrijn/mandelbulb.js
  - http://www.redcode.nl
*/

var formula = document.getElementById("formula");
var archivo = "/potencia.txt";
var currenty = 0.0;
var context;
var image;
var imageData;
var cHeight;
var cWidth;
var f = new Date().getTime();
var NUL = [0.0, 0.0, 0.0];
var z = [0.0, 0.0, 0.0];
var Iterations = 20.0;
var Power;
var last = 0;
var sphereZ = [0, 0, 0];
var MAX_ITER = 5000.0;
var DEPTH_OF_FIELD = 3.5;
var eyeDistanceFromNearField = 2.5; //Para acercar o alejar la vista
var halfPixel;
var pixel;
var lightAngle = 140.0;
var viewAngle = 150.0;
var smallStep = 0.01;
var bigStep = 0.02;
var lightLocation = [0.0, 0.0, 0.0];
var lightDirection = [0.0, 0.0, 0.0];
var nearFieldLocation = [0.0, 0.0, 0.0];
var viewDirection = [0.0, 0.0, 0.0];
var reverseDirection = [0.0, 0.0, 0.0];
var eyeLocation = [0.0, 0.0, 0.0];
var pixelLocation = [0.0, 0.0, 0.0];
var rayLocation = [0.0, 0.0, 0.0];
var tempViewDirectionX1 = [0.0, 0.0, 0.0];
var tempViewDirectionX2 = [0.0, 0.0, 0.0];
var tempViewDirectionY = [0.0, 0.0, 0.0];
var rayDirection = [0.0, 0.0, 0.0];
var normal = [0.0, 0.0, 0.0];
var halfway = [0.0, 0.0, 0.0];
var temp = [0.0, 0.0, 0.0];
var ro = [0.0, 0.0, 0.0];
var rd = [0.0, 0.0, 0.0];

window.onload = function () {
  Power = 8;
  iniciaAnimacion();
};

//Función para cambiar la potencia de z y poder observar otros fractales
function cambiaPotencia(){
  location.reload;
}

function iniciaAnimacion() {
  //Preparamos el lugar de la imagen
  var mandelbulbCanvas = document.getElementById("mandelbulto");
  cHeight = mandelbulbCanvas.height;
  cWidth = mandelbulbCanvas.width;
  context = mandelbulbCanvas.getContext("2d");
  context.fillRect(0, 0, cWidth, cHeight);

  //Con una profundidad de campo de 2.0x2.0 calculamos el detalle del pixel
  pixel = DEPTH_OF_FIELD / ((cHeight + cWidth) / 2);
  halfPixel = pixel / 2;
  image = context.getImageData(0, 0, cWidth, cHeight);
  imageData = image.data;

  anima();
}

function anima() {
  //Iniciamos el ángulo y la escena
  if (currenty == 0) {
    animaCamara();
    iniciaEscena();
  }

  // Dibujamos las líneas de nuestra imagen
  var start = new Date().getTime();
  while (currenty < cHeight && new Date().getTime() - start < 500) {
    imageData = draw(imageData, currenty++);
  }

  //Si llegamos al límite devolvemos el número del píxel a 0
  if (currenty >= cHeight) {
    currenty = 0;
    console.log("Took:" + (new Date().getTime() - f));
    f = new Date().getTime();
  }

  image.data = imageData;
  context.putImageData(image, 0, 0);

  //Le otorgamos recursividad infinita
  requestAnimFrame(function () {
    anima();
  });
}

window.requestAnimFrame = (function (callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 0);
    }
  );
})();

//Este método se encarga de realizar la escena de la imagen
function map(z) {
  return mandelbulb(z);
}
/*La siguiente función proviene de:
        http://blog.hvidtfeldts.net/index.php/2011/09/distance-estimated-3d-fractals-v-the-mandelbulb-different-de-approximations/*/
function mandelbulb(pos) {
  //Primero obtenemos los valores de la función requerida
  //gestionaFormula()

  //Cálculos
  igualaV1yV2(z, pos);
  var dr = 1.0;
  var r = 0.0;
  for (var i = 0; i < Iterations; i++) {
    r = length(z);
    if (r > DEPTH_OF_FIELD) break;

    // convert to polar coordinates
    var theta = Math.acos(z[2] / r);
    var phi = Math.atan2(z[1], z[0]);
    dr = Math.pow(r, Power - 1.0) * Power * dr + 1.0;

    // scale and rotate the point
    var zr = Math.pow(r, Power);
    theta = theta * Power;
    phi = phi * Power;

    // convert back to cartesian coordinates
    var sinTheta = Math.sin(theta);
    z[0] = sinTheta * Math.cos(phi);
    z[1] = Math.sin(phi) * sinTheta;
    z[2] = Math.cos(theta);
    sumaVectores(scalarMultiply(z, zr), pos);
  }
  return (0.5 * Math.log(r) * r) / dr;
}
//This method takes viewAngle and lightAngle and repositions
function iniciaEscena() {
  var rad = toRad(lightAngle);
  var lightX = (Math.cos(rad) * DEPTH_OF_FIELD) / 2;
  var lightZ = (Math.sin(rad) * DEPTH_OF_FIELD) / 2;

  lightLocation[0] = lightX;
  lightLocation[1] = DEPTH_OF_FIELD / 2;
  lightLocation[2] = lightZ;

  normalize(subtract(igualaV1yV2(lightDirection, NUL), lightLocation));

  var viewRad = toRad(viewAngle);
  var viewX = (Math.cos(viewRad) * DEPTH_OF_FIELD) / 2;
  var viewZ = (Math.sin(viewRad) * DEPTH_OF_FIELD) / 2;

  nearFieldLocation[0] = viewX;
  nearFieldLocation[1] = 0.0;
  nearFieldLocation[2] = viewZ;

  normalize(subtract(igualaV1yV2(viewDirection, NUL), nearFieldLocation));

  scalarMultiply(
    igualaV1yV2(reverseDirection, viewDirection),
    eyeDistanceFromNearField
  );
  subtract(igualaV1yV2(eyeLocation, nearFieldLocation), reverseDirection);
}
//The main draw function for a scanline
//Make sure setupScene is called first after adjusting the camera and/or light
function draw(imageData, y) {
  var cHalfWidth = cWidth / 2;
  var ny = y - cHeight / 2;

  scalarMultiply(
    crossProduct(
      turnOrthogonal(igualaV1yV2(tempViewDirectionY, viewDirection)),
      viewDirection
    ),
    ny * pixel
  );
  turnOrthogonal(igualaV1yV2(tempViewDirectionX1, viewDirection));

  for (var x = 0; x < cWidth; x++) {
    var nx = x - cHalfWidth;

    igualaV1yV2(pixelLocation, nearFieldLocation);

    scalarMultiply(
      igualaV1yV2(tempViewDirectionX2, tempViewDirectionX1),
      nx * pixel
    );
    sumaVectores(pixelLocation, tempViewDirectionX2);
    sumaVectores(pixelLocation, tempViewDirectionY);

    igualaV1yV2(rayLocation, pixelLocation);

    normalize(subtract(igualaV1yV2(rayDirection, rayLocation), eyeLocation));

    var distanceFromCamera = 0.0;
    var d = map(rayLocation);

    var iterations = 0;
    for (; iterations < MAX_ITER; iterations++) {
      if (d < halfPixel) {
        break;
      }

      //Increase rayLocation with direction and d:
      sumaVectores(rayLocation, scalarMultiply(rayDirection, d));
      //And reset ray direction:
      normalize(rayDirection);

      //Move the pixel location:
      distanceFromCamera = length(
        subtract(igualaV1yV2(temp, nearFieldLocation), rayLocation)
      );

      if (distanceFromCamera > DEPTH_OF_FIELD) {
        break;
      }
      d = map(rayLocation);
    }

    if (distanceFromCamera < DEPTH_OF_FIELD && distanceFromCamera > 0) {
      rayLocation[0] -= smallStep;
      var locationMinX = map(rayLocation);
      rayLocation[0] += bigStep;
      var locationPlusX = map(rayLocation);
      rayLocation[0] -= smallStep;

      rayLocation[1] -= smallStep;
      var locationMinY = map(rayLocation);
      rayLocation[1] += bigStep;
      var locationPlusY = map(rayLocation);
      rayLocation[1] -= smallStep;

      rayLocation[2] -= smallStep;
      var locationMinZ = map(rayLocation);
      rayLocation[2] += bigStep;
      var locationPlusZ = map(rayLocation);
      rayLocation[2] -= smallStep;

      //Calculate the normal:
      normal[0] = locationMinX - locationPlusX;
      normal[1] = locationMinY - locationPlusY;
      normal[2] = locationMinZ - locationPlusZ;
      normalize(normal);

      //Calculate the ambient light:
      var dotNL = dotProduct(lightDirection, normal);
      var diff = saturate(dotNL);

      //Calculate specular light:
      normalize(
        sumaVectores(igualaV1yV2(halfway, rayDirection), lightDirection)
      );

      var dotNH = dotProduct(halfway, normal);
      var spec = Math.pow(saturate(dotNH), 35);

      var shad = shadow(1.0, DEPTH_OF_FIELD, 16.0) + 0.25;
      var brightness = (10.0 + (200.0 + spec * 45.0) * shad * diff) / 270.0;

      var red = 10 + 380 * brightness;
      var green = 10 + 280 * brightness;
      var blue = 180 * brightness;

      red = clamp(red, 0, 255.0);
      green = clamp(green, 0, 255.0);
      blue = clamp(blue, 0, 255.0);

      var pixels = 4 * (y * cWidth + x);
      imageData[pixels + 0] = red;
      imageData[pixels + 1] = green;
      imageData[pixels + 2] = blue;
    } else {
      var pixels = 4 * (y * cWidth + x);
      imageData[pixels + 0] = 155 + clamp(iterations * 1.5, 0.0, 100.0);
      imageData[pixels + 1] = 205 + clamp(iterations * 1.5, 0.0, 50.0);
      imageData[pixels + 2] = 255;
    }
  }
  return imageData;
}
//In this method we calculate the 'soft' shadows
//From: http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
function shadow(mint, maxt, k) {
  var res = 1.0;
  for (var t = mint; t < maxt; ) {
    scalarMultiply(igualaV1yV2(rd, lightDirection), t);
    subtract(igualaV1yV2(ro, rayLocation), rd);
    var h = map(ro);
    if (h < 0.001) {
      return 0.0;
    }
    res = Math.min(res, (k * h) / t);
    t += h;
  }
  return res;
}
//Here we change the camera position and light(s)
function animaCamara() {
  lightAngle += 2.0;
  lightAngle %= 360.0;
  viewAngle += 2.0;
  viewAngle %= 360.0;
}
//Funciones para acercar y alejar la cámara
function acercaCamara() {
  eyeDistanceFromNearField += 0.5;
}
function alejaCamara() {
  if (eyeDistanceFromNearField > 0.5) {
    eyeDistanceFromNearField -= 0.5;
  } else {
    window.alert("¡Ya no se puede alejar la cámara más!");
  }
}
//Funciones auxiliares
function dotProduct(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}
function toRad(r) {
  return (r * Math.PI) / 180.0;
}
function saturate(n) {
  return clampVec(n, 0.0, 1.0);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}
function length(z) {
  return Math.sqrt(z[0] * z[0] + z[1] * z[1] + z[2] * z[2]);
}
function normalize(a) {
  return scalarMultiply(a, 1 / length(a));
}
function scalarMultiply(a, amount) {
  a[0] *= amount;
  a[1] *= amount;
  a[2] *= amount;
  return a;
}
function sumaVectores(v1, v2) {
  v1[0] += v2[0];
  v1[1] += v2[1];
  v1[2] += v2[2];
  return v1;
}
function subtract(v1, v2) {
  v1[0] -= v2[0];
  v1[1] -= v2[1];
  v1[2] -= v2[2];
  return v1;
}
function igualaV1yV2(v1, v2) {
  v1[0] = v2[0];
  v1[1] = v2[1];
  v1[2] = v2[2];
  return v1;
}
function turnOrthogonal(v1) {
  var inverse = 1.0 / Math.sqrt(v1[0] * v1[0] + v1[2] * v1[2]);
  var oldX = v1[0];
  v1[0] = -inverse * v1[2];
  v1[2] = inverse * oldX;
  return v1;
}
function crossProduct(v1, v2) {
  var oldX = v1[0];
  var oldY = v1[1];
  v1[0] = v2[1] * v1[2] - v2[2] * oldY;
  v1[1] = v2[2] * oldX - v2[0] * v1[2];
  v1[2] = v2[0] * oldY - v2[1] * oldX;
  return v1;
}
function clampVec(v1, min, max) {
  v1[0] = clamp(v1[0], min, max);
  v1[1] = clamp(v1[1], min, max);
  v1[2] = clamp(v1[2], min, max);
  return v1;
}

/*
Este código está inspirado y ayudado por el código de los siguientes enlaces:
  - https://github.com/royvanrijn/mandelbulb.js
  - http://www.redcode.nl
*/

//Constantes y variables globales
const formula = document.getElementById("formula");
var numero;
var archivo = "/potencia.txt";
var actual = 0.0;
var actualXY = [0,0];
var contexto;
var image;
var imageData;
var cHeight;
var cWidth;
var f = new Date().getTime();
var NUL = [0.0, 0.0, 0.0];
var z = [0.0, 0.0, 0.0];
var Iteraciones = 20.0;
var Potencia;
var last = 0;
var sphereZ = [0, 0, 0];
var MAX_ITER = 5000.0;
var DEPTH_OF_FIELD = 3.5;
var distanciaVisionCercana = 2.5; //Para acercar o alejar la vista
var mitadPixel;
var pixel;
var anguloLuz = 140.0;
var anguloEscena = 150.0;
var pasoPequeño = 0.01;
var pasoGrande = 0.02;
var localizacionLuz = [0.0, 0.0, 0.0];
var direccionLuz = [0.0, 0.0, 0.0];
var campoMásCercano = [0.0, 0.0, 0.0];
var direccionVista = [0.0, 0.0, 0.0];
var reverseDirection = [0.0, 0.0, 0.0];
var eyeLocation = [0.0, 0.0, 0.0];
var pixelLocation = [0.0, 0.0, 0.0];
var rayLocation = [0.0, 0.0, 0.0];
var tempDireccionVistaX1 = [0.0, 0.0, 0.0];
var tempDireccionVistaX2 = [0.0, 0.0, 0.0];
var tempDireccionVistaY = [0.0, 0.0, 0.0];
var direccionRayo = [0.0, 0.0, 0.0];
var normal = [0.0, 0.0, 0.0];
var vectorNulo = [0.0, 0.0, 0.0];
var temp = [0.0, 0.0, 0.0];
var ro = [0.0, 0.0, 0.0];
var rd = [0.0, 0.0, 0.0];

window.onload = function () {
  
  // Por defecto mostramos el Mandelbulb normal
  Potencia = 8;
  
  //Recogemos los datos de la url si los hubiera
  var query = window.location.search.substring(1);
  var parms = query.split('#');//Si pasas más de una variable, usas un separador, como #
  for (var i=0; i<parms.length; i++)
  {
    var pos = parms[i].indexOf('=');
    if (pos > 0)
    {
      var val = parms[i].substring(pos+1);
      Potencia = parseFloat(val);
    }
  }

  //Comienza el juego
  iniciaAnimacion();
};

//Función para cambiar la potencia de z y poder observar otros fractales mediante el campo
// de texto del HTML
formula.addEventListener("keyup", ({key}) => {
  if (key === "Enter") {
    numero = parseFloat(formula.value);
	  location.href=`?Potencia=${numero}`;
  }
});

//Preparamos el canvas de la imagen y comenzamos la animación
function iniciaAnimacion() {
  //Preparamos el lugar de la imagen
  var mandelbulbCanvas = document.getElementById("mandelbulto");
  cHeight = mandelbulbCanvas.height;
  cWidth = mandelbulbCanvas.width;
  contexto = mandelbulbCanvas.getContext("2d");
  contexto.fillRect(0, 0, cWidth, cHeight);

  //Con una profundidad de campo de 2.0x2.0 calculamos el detalle del pixel
  pixel = DEPTH_OF_FIELD / ((cHeight + cWidth) / 2);
  mitadPixel = pixel / 2;
  image = contexto.getImageData(0, 0, cWidth, cHeight);
  imageData = image.data;

  anima();
}

//
function anima() {
  //Iniciamos el ángulo y la escena
  if (actual == 0) {
    animaCamara();
    iniciaEscena();
  }

  // Dibujamos las líneas de nuestro fractal
  var start = new Date().getTime();
  while (actual < cHeight && new Date().getTime() - start < 500) {
    imageData = dibuja(imageData, actual++);
  }

  //Si llegamos al límite devolvemos el número del píxel a 0 y el tiempo
  // que hemos tardado en dibujar toda la escena
  if (actual >= cHeight) {
    actual = 0;
    console.log("Took:" + (new Date().getTime() - f));
    f = new Date().getTime();
  }

  //Actualizamos valores
  image.data = imageData;
  contexto.putImageData(image, 0, 0);

  //Le otorgamos recursividad infinita
  requestAnimFrame(function () {
    anima();
  });
}

//Le pedimos al navegador que no se olvide de dibujar
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

  //Cálculos de forma iterativa para la distancia del fractal
  igualaV1yV2(z, pos);
  var dr = 1.0;
  var r = 0.0;
  for (var i = 0; i < Iteraciones; i++) {

    //Nos aseguramos de que la parte real se quede donde nos interesa
    r = modulo(z);
    if (r > DEPTH_OF_FIELD) break;

    // Convertimos dr a coordenadas polares
    var theta = Math.acos(z[2] / r);
    var phi = Math.atan2(z[1], z[0]);
    dr = Math.pow(r, Potencia - 1.0) * Potencia * dr + 1.0;

    // Escalamos y rotamos los puntos
    var zr = Math.pow(r, Potencia);
    theta = theta * Potencia;
    phi = phi * Potencia;

    // Volvemos a las coordenadas cartesianas
    var sinTheta = Math.sin(theta);
    z[0] = sinTheta * Math.cos(phi);
    z[1] = Math.sin(phi) * sinTheta;
    z[2] = Math.cos(theta);
    sumaVectores(multiplicacionEscalar(z, zr), pos);

  }
  return (0.5 * Math.log(r) * r) / dr;
}

//Con este método reposicionamos la luz y la escena en el tiempo
function iniciaEscena() {
  var rad = aRad(anguloLuz);
  var lightX = (Math.cos(rad) * DEPTH_OF_FIELD) / 2;
  var lightZ = (Math.sin(rad) * DEPTH_OF_FIELD) / 2;

  localizacionLuz[0] = lightX;
  localizacionLuz[1] = DEPTH_OF_FIELD / 2;
  localizacionLuz[2] = lightZ;

  normaliza(restaVectores(igualaV1yV2(direccionLuz, NUL), localizacionLuz));

  var viewRad = aRad(anguloEscena);
  var viewX = (Math.cos(viewRad) * DEPTH_OF_FIELD) / 2;
  var viewZ = (Math.sin(viewRad) * DEPTH_OF_FIELD) / 2;

  campoMásCercano[0] = viewX;
  campoMásCercano[1] = 0.0;
  campoMásCercano[2] = viewZ;

  normaliza(restaVectores(igualaV1yV2(direccionVista, NUL), campoMásCercano));

  multiplicacionEscalar(
    igualaV1yV2(reverseDirection, direccionVista),
    distanciaVisionCercana
  );
  restaVectores(igualaV1yV2(eyeLocation, campoMásCercano), reverseDirection);
}
//La función de dibujado principal
function dibuja(imageData, y) {
  var cHalfWidth = cWidth / 2;
  var ny = y - cHeight / 2;

  multiplicacionEscalar(
    productoVectorial(
      vuelveOrtogonal(igualaV1yV2(tempDireccionVistaY, direccionVista)),
      direccionVista
    ),
    ny * pixel
  );
  vuelveOrtogonal(igualaV1yV2(tempDireccionVistaX1, direccionVista));

  for (var x = 0; x < cWidth; x++) {
    var nx = x - cHalfWidth;

    igualaV1yV2(pixelLocation, campoMásCercano);

    multiplicacionEscalar(
      igualaV1yV2(tempDireccionVistaX2, tempDireccionVistaX1),
      nx * pixel
    );
    sumaVectores(pixelLocation, tempDireccionVistaX2);
    sumaVectores(pixelLocation, tempDireccionVistaY);

    igualaV1yV2(rayLocation, pixelLocation);

    normaliza(restaVectores(igualaV1yV2(direccionRayo, rayLocation), eyeLocation));

    actualXY[0] = x;
    var distanceFromCamera = 0.0;
    var d = map(rayLocation);

    var Iteraciones = 0;
    for (; Iteraciones < MAX_ITER; Iteraciones++) {
      if (d < mitadPixel) {
        break;
      }

      sumaVectores(rayLocation, multiplicacionEscalar(direccionRayo, d));
      normaliza(direccionRayo);

      distanceFromCamera = modulo(
        restaVectores(igualaV1yV2(temp, campoMásCercano), rayLocation)
      );

      if (distanceFromCamera > DEPTH_OF_FIELD) {
        break;
      }
      actualXY[1] = Iteraciones;
      d = map(rayLocation);
    }

    if (distanceFromCamera < DEPTH_OF_FIELD && distanceFromCamera > 0) {
      rayLocation[0] -= pasoPequeño;
      var locationMinX = map(rayLocation);
      rayLocation[0] += pasoGrande;
      var locationPlusX = map(rayLocation);
      rayLocation[0] -= pasoPequeño;

      rayLocation[1] -= pasoPequeño;
      var locationMinY = map(rayLocation);
      rayLocation[1] += pasoGrande;
      var locationPlusY = map(rayLocation);
      rayLocation[1] -= pasoPequeño;

      rayLocation[2] -= pasoPequeño;
      var locationMinZ = map(rayLocation);
      rayLocation[2] += pasoGrande;
      var locationPlusZ = map(rayLocation);
      rayLocation[2] -= pasoPequeño;

      //Calcula la norma:
      normal[0] = locationMinX - locationPlusX;
      normal[1] = locationMinY - locationPlusY;
      normal[2] = locationMinZ - locationPlusZ;
      normaliza(normal);

      //Calcula la luz ambiente:
      var dotNL = productoEscalar(direccionLuz, normal);
      var diff = satura(dotNL);

      //Calcula la luz especular:
      normaliza(
        sumaVectores(igualaV1yV2(vectorNulo, direccionRayo), direccionLuz)
      );

      var dotNH = productoEscalar(vectorNulo, normal);
      var spec = Math.pow(satura(dotNH), 35);

      var shad = shadow(1.0, DEPTH_OF_FIELD, 16.0) + 0.25;
      var brightness = (10.0 + (200.0 + spec * 45.0) * shad * diff) / 270.0;

      var red = 10 + 380 * brightness;
      var green = 10 + 280 * brightness;
      var blue = 180 * brightness;

      red = restriccion(red, 0, 255.0);
      green = restriccion(green, 0, 255.0);
      blue = restriccion(blue, 0, 255.0);

      var pixels = 4 * (y * cWidth + x);
      imageData[pixels + 0] = red;
      imageData[pixels + 1] = green;
      imageData[pixels + 2] = blue;
    } else {
      var pixels = 4 * (y * cWidth + x);
      imageData[pixels + 0] = 155 + restriccion(Iteraciones * 1.5, 0.0, 100.0);
      imageData[pixels + 1] = 205 + restriccion(Iteraciones * 1.5, 0.0, 50.0);
      imageData[pixels + 2] = 255;
    }
  }
  return imageData;
}

//Calculamos las sombras
//Proveniente de: http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
function shadow(mint, maxt, k) {
  var res = 1.0;
  for (var t = mint; t < maxt; ) {
    multiplicacionEscalar(igualaV1yV2(rd, direccionLuz), t);
    restaVectores(igualaV1yV2(ro, rayLocation), rd);
    var h = map(ro);
    if (h < 0.001) {
      return 0.0;
    }
    res = Math.min(res, (k * h) / t);
    t += h;
  }
  return res;
}

//Cambiamos la posición de la cámara y las luces
function animaCamara() {
  anguloLuz += 2.0;
  anguloLuz %= 360.0;
  anguloEscena += 2.0;
  anguloEscena %= 360.0;
}

//Funciones para acercar y alejar la cámara
function acercaCamara() {
  distanciaVisionCercana += 0.5;
}
function alejaCamara() {
  if (distanciaVisionCercana > 0.5) {
    distanciaVisionCercana -= 0.5;
  } else {
    window.alert("¡Ya no se puede alejar la cámara más!");
  }
}

//Funciones auxiliares
function productoEscalar(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}
function aRad(r) {
  return (r * Math.PI) / 180.0;
}
function satura(n) {
  return restringeVec(n, 0.0, 1.0);
}
function restriccion(n, min, max) {
  return Math.max(min, Math.min(n, max));
}
function modulo(z) {
  return Math.sqrt(z[0] * z[0] + z[1] * z[1] + z[2] * z[2]);
}
function normaliza(a) {
  return multiplicacionEscalar(a, 1 / modulo(a));
}
function multiplicacionEscalar(a, amount) {
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
function restaVectores(v1, v2) {
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
function vuelveOrtogonal(v1) {
  var inverse = 1.0 / Math.sqrt(v1[0] * v1[0] + v1[2] * v1[2]);
  var oldX = v1[0];
  v1[0] = -inverse * v1[2];
  v1[2] = inverse * oldX;
  return v1;
}
function productoVectorial(v1, v2) {
  var oldX = v1[0];
  var oldY = v1[1];
  v1[0] = v2[1] * v1[2] - v2[2] * oldY;
  v1[1] = v2[2] * oldX - v2[0] * v1[2];
  v1[2] = v2[0] * oldY - v2[1] * oldX;
  return v1;
}
function restringeVec(v1, min, max) {
  v1[0] = restriccion(v1[0], min, max);
  v1[1] = restriccion(v1[1], min, max);
  v1[2] = restriccion(v1[2], min, max);
  return v1;
}

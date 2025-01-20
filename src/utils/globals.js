/**
 * Dirección del HOST donde haremos las peticiones.
 */
const host = 'http://localhost:8080';

/**
 * Permite acceso a métodos y propiedades globales a toda la aplicación.
 */

/**
 * Agrega una alerta al contenedor de alertas.
 * @param {*} message 
 * @param {*} type 
 */
function appendAlert(message, type) {
    const alert = document.getElementById('alert');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');
    alert.append(wrapper);
}

/**
 * Elimina todos los mensajes de alerta.
 */
function removeAlerts() {
    const alert = document.getElementById('alert');
    while (alert.firstElementChild) {
        alert.removeChild(alert.firstElementChild);
    }
}

export {
    host,
    appendAlert,
    removeAlerts
};
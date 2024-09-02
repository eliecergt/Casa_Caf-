document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos al cargar la página
    loadProducts();
    
    // Configuración de eventos
    setupEventListeners();
});

// Configuración de eventos
function setupEventListeners() {
    // Manejar el clic en el botón de crear producto
    document.getElementById('createProductButton').addEventListener('click', () => {
        $('#createProductModal').modal('show');
    });

    // Manejar el envío del formulario de creación de producto
    document.getElementById('createProductForm').addEventListener('submit', handleCreateProduct);

    // Manejar el envío del formulario CRUD
    document.getElementById('crudForm').addEventListener('submit', handleCrudForm);

    // Manejar el clic en el botón de eliminar
    document.getElementById('crudDelete').addEventListener('click', handleDeleteProduct);

    // Manejar el clic en el botón del carrito
    document.getElementById('cartButton').addEventListener('click', () => {
        $('#cartModal').modal('show');
    });

    // Manejar el envío del formulario de administrador
    document.getElementById('adminForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const response = await fetch('/api/register-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                $('#adminModal').modal('hide');
                alert('Administrador registrado exitosamente');
            } else {
                alert('Error al registrar administrador');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Manejar el envío del formulario de cliente
    document.getElementById('clienteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const nombre = document.getElementById('clienteNombre').value;
        const email = document.getElementById('clienteEmail').value;
        const password = document.getElementById('clientePassword').value;

        try {
            const response = await fetch('/api/register-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password }),
            });

            if (response.ok) {
                $('#clienteModal').modal('hide');
                alert('Cliente registrado exitosamente');
            } else {
                alert('Error al registrar cliente');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

// Manejar la creación de un nuevo producto
async function handleCreateProduct(event) {
    event.preventDefault();

    const productName = document.getElementById('createProductName').value;
    const productPrice = document.getElementById('createProductPrice').value;
    const productDescription = document.getElementById('createProductDescription').value;
    const productImage = document.getElementById('createProductImage').value;
    const productImageUpload = document.getElementById('productImageUpload').files[0];

    let imageURL = productImage;

    if (productImageUpload) {
        imageURL = await uploadImage(productImageUpload);
        if (!imageURL) return;
    }

    const productData = {
        nombre: productName,
        precio: productPrice,
        descripcion: productDescription,
        imagen: imageURL
    };

    try {
        const response = await fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });

        if (response.ok) {
            $('#createProductModal').modal('hide');
            await loadProducts();
        } else {
            alert('Error al crear el producto');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Manejar el formulario CRUD para crear o actualizar productos
async function handleCrudForm(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const productData = {
        nombre: document.getElementById('productName').value,
        precio: document.getElementById('productPrice').value,
        descripcion: document.getElementById('productDescription').value,
        imagen: document.getElementById('productImage').value
    };

    try {
        const response = await fetch(productId ? `/productos/${productId}` : '/productos', {
            method: productId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });

        if (response.ok) {
            $('#crudModal').modal('hide');
            await loadProducts();
        } else {
            alert('Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Manejar la eliminación de un producto
async function handleDeleteProduct() {
    const productId = document.getElementById('productId').value;

    try {
        const response = await fetch(`/productos/${productId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            $('#crudModal').modal('hide');
            await loadProducts();
        } else {
            alert('Error al eliminar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Subir una imagen y obtener su URL
async function uploadImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            return result.imageUrl;
        } else {
            alert('Error al subir la imagen');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

// Cargar productos desde el servidor y mostrarlos
async function loadProducts() {
    try {
        const response = await fetch('/productos');
        const products = await response.json();

        const productContainer = document.getElementById('productContainer');
        productContainer.innerHTML = '';

        products.forEach(product => {
            const productCard = `
                <div class="col-md-4">
                    <div class="card mb-4 shadow-sm">
                        <img src="${product.imagen}" class="card-img-top" alt="${product.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${product.nombre}</h5>
                            <p class="card-text">${product.descripcion}</p>
                            <p class="card-text"><strong>Precio: </strong>$${product.precio}</p>
                            <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id})">Editar</button>
                            <button class="btn btn-success btn-sm" onclick="addToCart(${product.id}, '${product.nombre}', ${product.precio})">Agregar al Carrito</button>
                        </div>
                    </div>
                </div>
            `;
            productContainer.innerHTML += productCard;
        });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

// Editar un producto
function editProduct(productId) {
    fetch(`/productos/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productPrice').value = product.precio;
            document.getElementById('productDescription').value = product.descripcion;
            document.getElementById('productImage').value = product.imagen;

            $('#crudModal').modal('show');
            document.getElementById('crudDelete').style.display = 'block';
        })
        .catch(error => console.error('Error al obtener el producto:', error));
}

// Carrito
const cart = [];

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartModal();
}

function updateCartModal() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    let total = 0;

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <h5>${item.name}</h5>
            <p>Precio: $${item.price}</p>
            <p>Cantidad: 
                <button class="btn btn-sm btn-secondary" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span id="quantity-${item.id}">${item.quantity}</span>
                <button class="btn btn-sm btn-secondary" onclick="changeQuantity(${item.id}, 1)">+</button>
            </p>
        </div>
    `).join('');

    total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `Total: $${total.toFixed(2)}`;
}

function changeQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            const index = cart.indexOf(item);
            cart.splice(index, 1);
        }
        updateCartModal();
    }
}

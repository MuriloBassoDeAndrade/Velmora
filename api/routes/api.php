<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CharacteristicController;
use App\Http\Controllers\Api\CartController;

// Authentication routes

Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::get('/user', [AuthController::class, 'me'])
    ->middleware('auth:sanctum');

// Product routes

Route::apiResource('products', ProductController::class)
    ->only(['index', 'show'])
    ->parameters(['products' => 'id']);

Route::get('/admin/products', [ProductController::class, 'indexAdmin'])
    ->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/products/{id}', [ProductController::class, 'showAdmin'])
    ->middleware(['auth:sanctum', 'admin']);

Route::apiResource('products', ProductController::class)
    ->except(['index', 'show'])
    ->parameters(['products' => 'id'])
    ->middleware(['auth:sanctum', 'admin']);

 // Category routes

Route::apiResource('categories', CategoryController::class)
    ->only(['index', 'show'])
    ->parameters(['categories' => 'id']);

Route::apiResource('categories', CategoryController::class)
    ->except(['index', 'show'])
    ->parameters(['categories' => 'id'])
    ->middleware(['auth:sanctum', 'admin']);

// Characteristic routes    

Route::apiResource('characteristics', CharacteristicController::class)
    ->only(['index', 'show'])
    ->parameters(['characteristics' => 'id']);

Route::apiResource('characteristics', CharacteristicController::class)
    ->except(['index', 'show'])
    ->parameters(['characteristics' => 'id'])
    ->middleware(['auth:sanctum', 'admin']);

// Cart routes
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'store']);
Route::put('/cart/items/{id}', [CartController::class, 'update']);
Route::delete('/cart/items/{id}', [CartController::class, 'destroy']);

Route::post('/cart/merge', [CartController::class, 'merge'])
    ->middleware('auth:sanctum');
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;

Route::get('/user', [AuthController::class, 'me'])
    ->middleware('auth:sanctum');

Route::apiResource('categories', CategoryController::class)
    ->only(['index', 'show'])
    ->parameters(['categories' => 'id']);

Route::apiResource('categories', CategoryController::class)
    ->except(['index', 'show'])
    ->parameters(['categories' => 'id'])
    ->middleware(['auth:sanctum', 'admin']);

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

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
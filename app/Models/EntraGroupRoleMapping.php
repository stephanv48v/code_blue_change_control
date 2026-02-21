<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntraGroupRoleMapping extends Model
{
    protected $fillable = ['group_id', 'group_name', 'role_name'];
}

require('dotenv').config(); // Load environment variables from .env

const express = require("express");
const app = express();
const fs = require('fs');
const path = require('path');

app.get('/', (req, res) => {
  res.send('<h1>Discord Bot is Running!</h1><p>Your bot is online and ready to respond to commands.</p>');
});

app.listen(3000, '0.0.0.0', () => {
  console.log("project is running on port 3000!");
})

const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Panda Coin system - simple file-based storage
const dataFile = './pandacoins.json';
const rolesFile = './role-milestones.json';

// Load existing data or create empty object
let pandaCoinData = {};
try {
  if (fs.existsSync(dataFile)) {
    pandaCoinData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading panda coin data, starting fresh');
  pandaCoinData = {};
}

// Load role milestones data
let roleMilestones = {};
try {
  if (fs.existsSync(rolesFile)) {
    roleMilestones = JSON.parse(fs.readFileSync(rolesFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading role milestones data, starting fresh');
  roleMilestones = {};
}

// Load suggestion channels data
const suggestionsFile = './suggestions.json';
let suggestionChannels = {};
try {
  if (fs.existsSync(suggestionsFile)) {
    suggestionChannels = JSON.parse(fs.readFileSync(suggestionsFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading suggestion channels data, starting fresh');
  suggestionChannels = {};
}

// Quest system - tracks user quests and progress
const questsFile = './quests.json';
let questData = {};
try {
  if (fs.existsSync(questsFile)) {
    questData = JSON.parse(fs.readFileSync(questsFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading quest data, starting fresh');
  questData = {};
}

function saveQuestData() {
  fs.writeFileSync(questsFile, JSON.stringify(questData, null, 2), 'utf8');
}

// Initialize user quest data if it doesn't exist
function initializeUserQuestData(userId) {
  if (!questData[userId]) {
    questData[userId] = {
      activeQuests: {},
      completedQuests: {},
      digCount: 0,
      huntCount: 0,
      powerCount: 0,
      goblinDefeated: false,
      orcDefeated: false,
      lastDigTime: 0,
      lastHuntTime: 0
    };
  }
  return questData[userId];
}

function getUserQuestData(userId) {
  return initializeUserQuestData(userId);
}

// Update dig count for quest tracking
function updateDigCount(userId) {
  const userQuestData = getUserQuestData(userId);
  userQuestData.digCount++;
  saveQuestData();
}

// Update power count for quest tracking
function updatePowerCount(userId) {
  const userQuestData = getUserQuestData(userId);
  const userStats = getUserStats(userId);
  const totalPower = userStats.health + userStats.attack + userStats.defense + userStats.speed + userStats.luck;
  userQuestData.powerCount = totalPower;
  saveQuestData();
}

// Update goblin defeat status for quest tracking
function updateGoblinDefeat(userId) {
  const userQuestData = getUserQuestData(userId);
  userQuestData.goblinDefeated = true;
  saveQuestData();
  
  // Check if this completes the goblin quest
  checkQuestCompletion(userId, 'goblin', 0);
}

// Update hunt count for quest tracking
function updateHuntCount(userId) {
  const userQuestData = getUserQuestData(userId);
  userQuestData.huntCount++;
  saveQuestData();
  
  // Check if this completes the hunt quest
  checkQuestCompletion(userId, 'hunt', 0);
}

// Update orc defeat for quest tracking
function updateOrcDefeat(userId) {
  const userQuestData = getUserQuestData(userId);
  userQuestData.orcDefeated = true;
  saveQuestData();
  
  // Check if this completes the orc quest
  checkQuestCompletion(userId, 'orc', 0);
}

// Check quest completion
function checkQuestCompletion(userId, questType, count) {
  const userQuestData = getUserQuestData(userId);
  
  if (questType === 'dig') {
    if (userQuestData.digCount >= 10 && !userQuestData.completedQuests.dig10) {
      userQuestData.completedQuests.dig10 = {
        completedAt: Date.now(),
        reward: 25,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Dig Apprentice',
        reward: 25,
        description: 'Dig 10 times to learn the basics'
      };
    }
  }
  
  if (questType === 'power') {
    if (userQuestData.powerCount >= 10 && !userQuestData.completedQuests.power10) {
      userQuestData.completedQuests.power10 = {
        completedAt: Date.now(),
        reward: 50,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Dungeon Preparation',
        reward: 50,
        description: 'Achieve at least 10 total power'
      };
    }
    
    if (userQuestData.powerCount >= 25 && !userQuestData.completedQuests.power25) {
      userQuestData.completedQuests.power25 = {
        completedAt: Date.now(),
        reward: 125,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Legendary Warrior',
        reward: 125,
        description: 'Achieve at least 25 total power'
      };
    }
  }
  
  if (questType === 'goblin') {
    if (userQuestData.goblinDefeated && !userQuestData.completedQuests.goblinDefeat) {
      userQuestData.completedQuests.goblinDefeat = {
        completedAt: Date.now(),
        reward: 75,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Goblin Slayer',
        reward: 75,
        description: 'Defeat the goblin enemy in the dungeon'
      };
    }
  }
  
  if (questType === 'hunt') {
    if (userQuestData.huntCount >= 20 && !userQuestData.completedQuests.hunt20) {
      userQuestData.completedQuests.hunt20 = {
        completedAt: Date.now(),
        reward: 100,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Master Hunter',
        reward: 100,
        description: 'Hunt 20 times to become a skilled hunter'
      };
    }
  }
  
  if (questType === 'orc') {
    if (userQuestData.orcDefeated && !userQuestData.completedQuests.orcDefeat) {
      userQuestData.completedQuests.orcDefeat = {
        completedAt: Date.now(),
        reward: 150,
        claimed: false
      };
      saveQuestData();
      return {
        completed: true,
        questName: 'Orc Slayer',
        reward: 150,
        description: 'Defeat The Orc Enemy in the dungeon'
      };
    }
  }
  
  return { completed: false };
}

// Multiplayer Dungeon System
const multiplayerBattles = {};
const multiplayerBattlesFile = './multiplayer-battles.json';

// Load multiplayer battles data
function loadMultiplayerBattles() {
  try {
    if (fs.existsSync(multiplayerBattlesFile)) {
      const data = fs.readFileSync(multiplayerBattlesFile, 'utf8');
      Object.assign(multiplayerBattles, JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading multiplayer battles:', error);
  }
}

// Save multiplayer battles data
function saveMultiplayerBattles() {
  try {
    fs.writeFileSync(multiplayerBattlesFile, JSON.stringify(multiplayerBattles, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving multiplayer battles:', error);
  }
}

// Initialize multiplayer battles
loadMultiplayerBattles();

// Boss definitions
const multiplayerBosses = {
  crazy_giant: {
    name: "The Crazy Giant",
    health: 80,
    maxHealth: 80,
    attack: 15,
    defense: 5,
    special: "giant_slam",
    phases: [
      { health: 50, behavior: "normal" },
      { health: 25, behavior: "enraged" }
    ]
  }
};

// Generate battle ID
function generateBattleId() {
  return 'BATTLE_' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Create multiplayer battle
function createMultiplayerBattle(userId, bossType) {
  console.log(`🔍 DEBUG: createMultiplayerBattle called with userId: ${userId}, bossType: ${bossType}`);
  
  const battleId = generateBattleId();
  console.log(`🔍 DEBUG: Generated battleId: ${battleId}`);
  
  const boss = multiplayerBosses[bossType];
  console.log(`🔍 DEBUG: Boss object:`, boss);
  
  if (!boss) {
    console.log(`🔍 DEBUG: Invalid boss type: ${bossType}`);
    return { success: false, error: 'Invalid boss type' };
  }
  
  // Check if user has enough coins and mana
  console.log(`🔍 DEBUG: Checking coins for userId: ${userId}`);
  const userCoins = getUserCoins(userId);
  console.log(`🔍 DEBUG: User coins: ${userCoins}`);
  
  if (userCoins < 75) {
    console.log(`🔍 DEBUG: Not enough coins. User has: ${userCoins}, needs: 75`);
    return { success: false, error: 'You need 75 Panda Coins to create a battle' };
  }
  
  // Check if user has enough mana
  console.log(`🔍 DEBUG: Checking mana for userId: ${userId}`);
  const userMana = getUserMana(userId);
  console.log(`🔍 DEBUG: User mana: ${userMana}`);
  
  if (userMana < 45) {
    console.log(`🔍 DEBUG: Not enough mana. User has: ${userMana}, needs: 45`);
    return { success: false, error: 'You need 45 mana to create a battle' };
  }
  
  // Deduct coins and mana
  console.log(`🔍 DEBUG: Deducting 75 coins and 45 mana from userId: ${userId}`);
  removeCoins(userId, 75);
  spendMana(userId, 45);
  console.log(`🔍 DEBUG: Coins and mana deducted successfully`);
  
  // Get host username
  console.log(`🔍 DEBUG: Getting host username for userId: ${userId}`);
  let hostUsername = 'Unknown';
  try {
    const user = client.users.cache.get(userId);
    if (user) {
      hostUsername = user.username;
      console.log(`🔍 DEBUG: Found host username: ${hostUsername}`);
    }
  } catch (error) {
    console.log(`Could not get username for host ${userId}`);
  }
  
  // Create battle state
  multiplayerBattles[battleId] = {
    boss: bossType,
    bossHealth: boss.health,
    maxBossHealth: boss.maxHealth,
    host: userId,
    hostUsername: hostUsername,
    players: [
      {
        userId: userId,
        health: getUserStats(userId).health,
        maxHealth: getUserStats(userId).health,
        attack: getUserStats(userId).attack,
        defense: getUserStats(userId).defense,
        status: 'ready'
      }
    ],
    status: 'waiting',
    createdAt: Date.now(),
    joinDeadline: Date.now() + (30 * 1000), // 30 seconds
    currentTurn: null,
    turnOrder: [userId],
    currentPlayerIndex: 0,
    round: 0,
    battleLog: [],
    channelId: null, // Will be set when battle is created
    messageId: null, // Will be set when embed is created
    turnDeadline: null // When current player's turn expires
  };
  
  console.log(`🔍 DEBUG: Creating battle state for battleId: ${battleId}`);
  console.log(`🔍 DEBUG: Battle state created successfully`);
  
  saveMultiplayerBattles();
  console.log(`🔍 DEBUG: Multiplayer battles saved to file`);
  
  console.log(`🔍 DEBUG: createMultiplayerBattle completed successfully`);
  return { success: true, battleId, boss };
}

// Calculate remaining time for battle
function getBattleTimeRemaining(battleId) {
  const battle = multiplayerBattles[battleId];
  if (!battle || battle.status !== 'waiting') {
    return 0;
  }
  
  const remaining = Math.max(0, battle.joinDeadline - Date.now());
  return Math.ceil(remaining / 1000); // Return seconds
}

// Format countdown time for display
function formatBattleCountdown(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Join multiplayer battle
function joinMultiplayerBattle(userId, battleId) {
  const battle = multiplayerBattles[battleId];
  
  if (!battle) {
    return { success: false, error: 'Battle not found' };
  }
  
  if (battle.status !== 'waiting') {
    return { success: false, error: 'Battle has already started or ended' };
  }
  
  if (Date.now() > battle.joinDeadline) {
    return { success: false, error: 'Join window has expired' };
  }
  
  // Check if player already joined
  const existingPlayer = battle.players.find(p => p.userId === userId);
  if (existingPlayer) {
    return { success: false, error: 'You have already joined this battle' };
  }
  
  // Check if user is the host (host can't join their own battle)
  if (battle.host === userId) {
    return { success: false, error: 'You are the host of this battle and cannot join it again' };
  }
  
  // Check if battle is full (max 4 players)
  if (battle.players.length >= 4) {
    return { success: false, error: 'Battle is full' };
  }
  
  // Get player stats
  const playerStats = getUserStats(userId);
  
  // Add player with actual stats
  battle.players.push({
    userId: userId,
    health: playerStats.health,
    maxHealth: playerStats.health,
    attack: playerStats.attack,
    defense: playerStats.defense,
    status: 'ready'
  });
  
  battle.turnOrder.push(userId);
  
  // Auto-start if 4 players join OR if 30 seconds passed AND at least 2 players
  if (battle.players.length >= 4 || (Date.now() >= battle.joinDeadline && battle.players.length >= 2)) {
    startMultiplayerBattle(battleId);
  }
  
  saveMultiplayerBattles();
  
  return { success: true, battle };
}

// Check and refund if no one joined
async function checkAndRefundBattle(battleId) {
  const battle = multiplayerBattles[battleId];
  
  if (!battle || battle.status !== 'waiting') {
    return null;
  }
  
  if (Date.now() > battle.joinDeadline && battle.players.length < 2) {
                          // Refund the host if not enough players joined
                      addCoins(battle.host, 75);
                      addMana(battle.host, 45);
    battle.status = 'cancelled';
    saveMultiplayerBattles();
    
    // Send expired battle embed to channel
    if (battle.channelId) {
      try {
        const channel = client.channels.cache.get(battle.channelId);
        if (channel) {
          const expiredEmbed = {
            color: 0xFF0000,
            title: '⏰ **Battle Expired!**',
            description: `**${battle.hostUsername || 'Unknown'}**'s battle against **The Crazy Giant** has expired!`,
            fields: [
              {
                name: '👹 Boss',
                value: 'The Crazy Giant',
                inline: true
              },
              {
                name: '👥 Players Joined',
                value: `${battle.players.length}/4`,
                inline: true
              },
                                              {
                                  name: '💰 Refund',
                                  value: '75 Panda Coins + 45 Mana returned to host',
                                  inline: true
                                },
              {
                name: '🎯 Battle ID',
                value: `\`${battleId}\``,
                inline: false
              }
            ],
            footer: {
              text: 'Not enough players joined within the time limit',
              icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
            },
            timestamp: new Date().toISOString()
          };
          
          await channel.send({ embeds: [expiredEmbed] });
          console.log(`⏰ Sent expired battle embed for ${battleId}`);
        }
      } catch (error) {
        console.log(`❌ Could not send expired battle embed for ${battleId}:`, error.message);
      }
    }
    
    return { success: true, message: 'Battle cancelled - not enough players joined. Host refunded 75 coins and 45 stamina.' };
  } else if (Date.now() > battle.joinDeadline && battle.players.length >= 2) {
    // Start battle if enough players joined but time expired
    const result = startMultiplayerBattle(battleId);
    if (result.success) {
      return { success: true, message: 'Battle starting with available players!', battleStarted: true };
    }
  }
  
  return null;
}

// Start multiplayer battle
function startMultiplayerBattle(battleId) {
  const battle = multiplayerBattles[battleId];
  
  if (!battle || battle.status !== 'waiting') {
    return { success: false, error: 'Cannot start battle' };
  }
  
  if (battle.players.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' };
  }
  
  battle.status = 'active';
  battle.round = 1;
  battle.currentTurn = 'boss';
  
  // Boss attacks all players
  const boss = multiplayerBosses[battle.boss];
  battle.battleLog.push(`🎮 **Multiplayer Battle Started!** ${boss.name} vs ${battle.players.length} players!`);
  battle.battleLog.push(`👹 Boss Health: ${battle.bossHealth}/${battle.maxBossHealth}`);
  
  battle.players.forEach(player => {
    const damage = Math.max(1, boss.attack - player.defense);
    player.health = Math.max(0, player.health - damage);
    
    // Get username for battle log
    let username = player.userId;
    try {
      const user = client.users.cache.get(player.userId);
      if (user) {
        username = user.username;
      }
    } catch (error) {
      console.log(`Could not get username for ${player.userId} in battle log`);
    }
    
    battle.battleLog.push(`💥 ${boss.name} attacks ${username} for ${damage} damage! (${player.health}/${player.maxHealth} HP)`);
  });
  
  // Set first player turn
  battle.currentTurn = 'players';
  battle.currentPlayerIndex = 0;
  battle.turnDeadline = Date.now() + (10 * 1000); // 10 seconds
  battle.battleLog.push(`\n**Round ${battle.round}:** Players' turn!`);
  
  saveMultiplayerBattles();
  
  return { success: true, battle };
}

// Process player attack
function processMultiplayerAttack(userId, battleId, attackType) {
  const battle = multiplayerBattles[battleId];
  
  if (!battle || battle.status !== 'active') {
    return { success: false, error: 'Battle not active' };
  }
  
  if (battle.currentTurn !== 'players') {
    return { success: false, error: 'Not player turn' };
  }
  
  const currentPlayerId = battle.turnOrder[battle.currentPlayerIndex];
  if (currentPlayerId !== userId) {
    return { success: false, error: 'Not your turn' };
  }
  
  const player = battle.players.find(p => p.userId === userId);
  if (!player || player.health <= 0) {
    return { success: false, error: 'Player not found or dead' };
  }
  
  const boss = multiplayerBosses[battle.boss];
  let damage = 0;
  let message = '';
  
  // Get username for battle log
  let username = player.userId;
  try {
    const user = client.users.cache.get(player.userId);
    if (user) {
      username = user.username;
    }
  } catch (error) {
    console.log(`Could not get username for ${player.userId} in attack log`);
  }
  
  if (attackType === 'basic') {
    damage = Math.max(1, player.attack - boss.defense);
    message = `⚔️ **${username}** attacks for **${damage}** damage!`;
    battle.battleLog.push(message);
  } else if (attackType === 'defend') {
    player.defense += 3; // Temporary defense boost
    message = `🛡️ **${username}** defends! (+3 defense this turn)`;
    battle.battleLog.push(message);
  }
  
  // Apply damage to boss
  if (damage > 0) {
    battle.bossHealth = Math.max(0, battle.bossHealth - damage);
    battle.battleLog.push(`👹 Boss Health: ${battle.bossHealth}/${battle.maxBossHealth}`);
  }
  
  // Move to next player
  battle.currentPlayerIndex++;
  
  // Skip dead players in turn order
  while (battle.currentPlayerIndex < battle.turnOrder.length) {
    const nextPlayerId = battle.turnOrder[battle.currentPlayerIndex];
    const nextPlayer = battle.players.find(p => p.userId === nextPlayerId);
    if (nextPlayer && nextPlayer.health > 0) {
      break; // Found alive player
    }
    battle.currentPlayerIndex++; // Skip dead player
  }
  
  // Set next turn deadline if there are more alive players
  if (battle.currentPlayerIndex < battle.turnOrder.length) {
    battle.turnDeadline = Date.now() + (10 * 1000); // 10 seconds for next player
  }
  
  // Check if all alive players have attacked
  const alivePlayerIds = battle.players.filter(p => p.health > 0).map(p => p.userId);
  const hasAttackedAllAlive = battle.turnOrder.slice(0, battle.currentPlayerIndex).every(playerId => 
    alivePlayerIds.includes(playerId)
  );
  
  if (battle.currentPlayerIndex >= battle.turnOrder.length || hasAttackedAllAlive) {
    // Boss turn
    battle.currentTurn = 'boss';
    battle.currentPlayerIndex = 0;
    battle.round++;
    
    battle.battleLog.push(`\n**Round ${battle.round}:** ${boss.name} attacks all players!`);
    
    // Boss attacks all players
    battle.players.forEach(player => {
      if (player.health > 0) {
        const bossDamage = Math.max(1, boss.attack - player.defense);
        player.health = Math.max(0, player.health - bossDamage);
        
        // Get username for battle log
        let username = player.userId;
        try {
          const user = client.users.cache.get(player.userId);
          if (user) {
            username = user.username;
          }
        } catch (error) {
          console.log(`Could not get username for ${player.userId} in battle log`);
        }
        
        battle.battleLog.push(`💥 ${boss.name} attacks ${username} for ${bossDamage} damage! (${player.health}/${player.maxHealth} HP)`);
      }
    });
    
    // Reset player turns - start with first alive player
    battle.currentTurn = 'players';
    battle.currentPlayerIndex = 0;
    
    // Find first alive player
    while (battle.currentPlayerIndex < battle.turnOrder.length) {
      const playerId = battle.turnOrder[battle.currentPlayerIndex];
      const player = battle.players.find(p => p.userId === playerId);
      if (player && player.health > 0) {
        break; // Found first alive player
      }
      battle.currentPlayerIndex++;
    }
    
    battle.turnDeadline = Date.now() + (10 * 1000); // 10 seconds for first player
    battle.battleLog.push(`\n**Round ${battle.round}:** Players' turn!`);
  }
  
  // Check for battle end
  const alivePlayers = battle.players.filter(p => p.health > 0);
  if (battle.bossHealth <= 0) {
    // Victory - all players get rewards, including dead ones
    battle.status = 'completed';
    const rewardPerPlayer = Math.floor(300 / battle.players.length);
    const expPerPlayer = 25;
    
    battle.players.forEach(player => {
      addCoins(player.userId, rewardPerPlayer);
      addExperience(player.userId, expPerPlayer);
      
      // Crazy Giant loot drops
      const dropChance = Math.random() * 100;
      let dropMessage = '';
      
      if (dropChance < 0.5) {
        // 0.5% chance for Golden Puppy
        addPetToInventory(player.userId, 'Golden Puppy', 1);
        markItemDiscovered(player.userId, 'Golden Puppy');
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Golden Puppy**! (+6 luck)`;
      } else if (dropChance < 4) {
        // 3.5% chance for Cerberus
        addGearToInventory(player.userId, 'ride', 'Cerberus', 1);
        markItemDiscovered(player.userId, 'Cerberus');
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Cerberus**! (+2 attack, +6 speed)`;
      } else if (dropChance < 16) {
        // 12% chance for Broken Ancient Dual Blades
        addGearToInventory(player.userId, 'weapon', 'Broken Ancient Dual Blades', 1);
        markItemDiscovered(player.userId, 'Broken Ancient Dual Blades');
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Broken Ancient Dual Blades**! (+15 attack, +2 speed)`;
      } else if (dropChance < 28) {
        // 12% chance for Broken Ancient Armor
        addGearToInventory(player.userId, 'armor', 'Broken Ancient Armor', 1);
        markItemDiscovered(player.userId, 'Broken Ancient Armor');
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Broken Ancient Armor**! (+10 health, +9 defense)`;
      } else if (dropChance < 40) {
        // 12% chance for Broken Ancient Helmet
        addGearToInventory(player.userId, 'helmet', 'Broken Ancient Helmet', 1);
        markItemDiscovered(player.userId, 'Broken Ancient Helmet');
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Broken Ancient Helmet**! (+9 defense, +9 health)`;
      } else if (dropChance < 60) {
        // 20% chance for Giant's Massive Club
        addItemToInventory(player.userId, "Giant's Massive Club", 1);
        markItemDiscovered(player.userId, "Giant's Massive Club");
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Giant's Massive Club**! (Sell for 8 coins)`;
      } else if (dropChance < 80) {
        // 20% chance for Giant's Jewel
        addItemToInventory(player.userId, "Giant's Jewel", 1);
        markItemDiscovered(player.userId, "Giant's Jewel");
        dropMessage = `🎁 **${player.userId === battle.host ? 'Host' : 'Player'}** found **Giant's Jewel**! (Sell for 24 coins)`;
      }
      
      if (dropMessage) {
        battle.battleLog.push(dropMessage);
      }
    });
    battle.battleLog.push(`\n🎉 **VICTORY!** Boss defeated! Each player gets **${rewardPerPlayer}** Panda Coins and **${expPerPlayer}** experience!`);
  } else if (alivePlayers.length === 0) {
    // Defeat - only when ALL players are dead
    battle.status = 'completed';
    battle.battleLog.push(`\n💀 **DEFEAT!** All players have fallen! The Crazy Giant has won!`);
  }
  
  saveMultiplayerBattles();
  
  return { success: true, battle, message };
}

// Get battle status
function getMultiplayerBattleStatus(battleId) {
  const battle = multiplayerBattles[battleId];
  if (!battle) {
    return { success: false, error: 'Battle not found' };
  }
  return { success: true, battle };
}

// Create battle embed for active battles
function createBattleEmbed(battleId) {
  const battle = multiplayerBattles[battleId];
  if (!battle || battle.status !== 'active') {
    return null;
  }
  
  const boss = multiplayerBosses[battle.boss];
  
  const battleEmbed = {
    color: 0x8B4513,
    title: `🎮 **Multiplayer Battle - ${boss.name}**`,
    description: battle.battleLog.slice(-5).join('\n'), // Show last 5 log entries
    fields: [
      {
        name: '👹 Boss Health',
        value: `${battle.bossHealth}/${battle.maxBossHealth}`,
        inline: false
      },
      {
        name: '👥 Players',
        value: battle.players.map(player => {
          const status = player.health > 0 ? '🛡️' : '💀';
          // Try to get username from client cache, fallback to ID
          let username = player.userId;
          try {
            const user = client.users.cache.get(player.userId);
            if (user) {
              username = user.username;
            }
          } catch (error) {
            console.log(`Could not get username for ${player.userId}, using ID`);
          }
          return `${status} **${username}**: ${player.health}/${player.maxHealth} HP`;
        }).join('\n'),
        inline: false
      }
    ],
    footer: {
      text: `Round ${battle.round} - ${battle.currentTurn === 'boss' ? 'Boss turn' : 'Player turn'}`,
      icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
    },
    timestamp: new Date().toISOString()
  };
  
  return battleEmbed;
}

// Handle expired turns in multiplayer battles
function handleExpiredTurns() {
  Object.keys(multiplayerBattles).forEach(battleId => {
    const battle = multiplayerBattles[battleId];
    
    if (battle && battle.status === 'active' && battle.currentTurn === 'players') {
      if (battle.turnDeadline && Date.now() > battle.turnDeadline) {
        // Turn expired, auto-attack
        const currentPlayerId = battle.turnOrder[battle.currentPlayerIndex];
        const currentPlayer = battle.players.find(p => p.userId === currentPlayerId);
        
        if (currentPlayer && currentPlayer.health > 0) {
          console.log(`⏰ Auto-attack for ${currentPlayerId} in battle ${battleId}`);
          processMultiplayerAttack(currentPlayerId, battleId, 'basic');
        }
      }
    }
  });
}

// Update multiplayer battle embeds with live countdown
async function updateMultiplayerBattleEmbeds() {
  console.log('⏰ Checking for waiting battles to update...');
  for (const battleId of Object.keys(multiplayerBattles)) {
    const battle = multiplayerBattles[battleId];
    
    if (battle && battle.status === 'waiting') {
      const timeRemaining = getBattleTimeRemaining(battleId);
      const formattedTime = formatBattleCountdown(timeRemaining);
      
      console.log(`⏰ Battle ${battleId}: ${formattedTime} remaining, ${battle.players.length} players`);
      
      // Check if battle should start or be refunded
      if (timeRemaining <= 0) {
        const refundResult = await checkAndRefundBattle(battleId);
        if (refundResult) {
          console.log(`⏰ Auto-updated battle ${battleId}: ${refundResult.message}`);
          
          // If battle started, we need to create a battle embed for players
          if (refundResult.battleStarted) {
            console.log(`⏰ Battle ${battleId} auto-started with ${battle.players.length} players!`);
            
            // Create battle embed
            const battleEmbed = createBattleEmbed(battleId);
            if (battleEmbed) {
              // Add attack buttons for the first player's turn
              let attackRow = null;
              if (battle.status === 'active' && battle.currentTurn === 'players') {
                const currentPlayerId = battle.turnOrder[battle.currentPlayerIndex];
                const currentPlayer = battle.players.find(p => p.userId === currentPlayerId);
                if (currentPlayer && currentPlayer.health > 0) {
                  attackRow = {
                    type: 1,
                    components: [
                      {
                        type: 2,
                        style: 1, // Primary style (blue)
                        label: '⚔️ Basic Attack',
                        custom_id: `multi_attack_${battleId}_basic`,
                        emoji: { name: '⚔️' },
                      },
                      {
                        type: 2,
                        style: 2, // Secondary style (gray)
                        label: '🛡️ Defend',
                        custom_id: `multi_attack_${battleId}_defend`,
                        emoji: { name: '🛡️' },
                      },
                    ],
                  };
                }
              }
              
              const components = attackRow ? [attackRow] : [];
              
              // Send battle embed to the channel
              if (battle.channelId) {
                try {
                  const channel = client.channels.cache.get(battle.channelId);
                  if (channel) {
                    await channel.send({ embeds: [battleEmbed], components: components });
                    console.log(`🎮 Battle ${battleId} embed sent to channel ${battle.channelId}!`);
                  }
                } catch (error) {
                  console.error(`❌ Failed to send battle embed for ${battleId}:`, error);
                }
              }
            }
          }
        }
              } else {
          // Update waiting battle embed with live countdown
          if (battle.messageId && battle.channelId) {
            console.log(`⏰ Attempting to update embed for battle ${battleId}...`);
            try {
              const channel = client.channels.cache.get(battle.channelId);
              if (channel) {
                console.log(`⏰ Found channel ${battle.channelId} for battle ${battleId}`);
                const message = await channel.messages.fetch(battle.messageId);
                if (message) {
                  console.log(`⏰ Found message ${battle.messageId} for battle ${battleId}`);
                // Create updated embed with live countdown
                const boss = multiplayerBosses[battle.boss];
                const updatedEmbed = {
                  color: 0x8B4513,
                  title: '🎮 **Multiplayer Battle Created!**',
                  description: `**${battle.hostUsername || 'Unknown'}** has started a battle against **${boss.name}**!`,
                  fields: [
                    {
                      name: '👹 Boss',
                      value: `${boss.name}`,
                      inline: true
                    },
                    {
                      name: '💰 Entry Cost',
                      value: '75 Panda Coins (PAID)',
                      inline: true
                    },
                    {
                      name: '⏰ Join Window',
                      value: `${formattedTime} remaining`,
                      inline: true
                    },
                    {
                      name: '👥 Players',
                      value: `${battle.players.length}/4`,
                      inline: true
                    },
                    {
                      name: '🎯 Battle ID',
                      value: `\`${battleId}\``,
                      inline: false
                    },
                    {
                      name: '📋 How to Join',
                      value: `Click the **JOIN BATTLE** button below to join this battle!`,
                      inline: false
                    }
                  ],
                  footer: {
                    text: `Battle will auto-start when 4 players join or ${formattedTime} expire (min 2 players)!`,
                    icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                  },
                  timestamp: new Date().toISOString()
                };
                
                const joinRow = {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 3, // Success style (green)
                      label: '⚔️ JOIN BATTLE',
                      custom_id: `multi_join_${battleId}`,
                      emoji: { name: '⚔️' },
                    },
                  ],
                };
                
                await message.edit({ embeds: [updatedEmbed], components: [joinRow] });
                console.log(`⏰ Updated live countdown for battle ${battleId}: ${formattedTime} remaining`);
              }
            }
          } catch (error) {
            console.log(`❌ Could not edit message for battle ${battleId}:`, error.message);
          }
        }
        
        // Also update the join embed if it exists
        if (battle.joinMessageId && battle.channelId) {
          try {
            const channel = client.channels.cache.get(battle.channelId);
            if (channel) {
              const joinMessage = await channel.messages.fetch(battle.joinMessageId);
              if (joinMessage) {
                // Get boss data for the join embed
                const boss = multiplayerBosses[battle.boss];
                
                // Create updated join embed with live countdown
                const updatedJoinEmbed = {
                  color: 0x00FF00,
                  title: '🎮 **Player Joined Multiplayer Battle!**',
                  description: `**${battle.hostUsername || 'Unknown'}** has joined the battle against **${boss.name}**!`,
                  fields: [
                    {
                      name: '👹 Boss',
                      value: `${boss.name}`,
                      inline: true
                    },
                    {
                      name: '👥 Players',
                      value: `${battle.players.length}/4`,
                      inline: true
                    },
                    {
                      name: '⏰ Time Remaining',
                      value: `${formattedTime}`,
                      inline: true
                    },
                    {
                      name: '🎯 Battle ID',
                      value: `\`${battleId}\``,
                      inline: false
                    }
                  ],
                  footer: {
                    text: battle.players.length >= 4 ? 'Battle will start immediately!' : `Waiting for more players... (${formattedTime} left, min 2 players)`,
                    icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                  },
                  timestamp: new Date().toISOString()
                };
                
                // Add join button for other players if battle is still waiting
                let updatedJoinRow = null;
                if (battle.status === 'waiting' && battle.players.length < 4) {
                  updatedJoinRow = {
                    type: 1,
                    components: [
                      {
                        type: 2,
                        style: 3, // Success style (green)
                        label: '⚔️ JOIN BATTLE',
                        custom_id: `multi_join_${battleId}`,
                        emoji: { name: '⚔️' },
                      },
                    ],
                  };
                }
                
                const components = updatedJoinRow ? [updatedJoinRow] : [];
                await joinMessage.edit({ embeds: [updatedJoinEmbed], components: components });
                console.log(`⏰ Updated join embed countdown for battle ${battleId}: ${formattedTime} remaining`);
              }
            }
          } catch (error) {
            console.log(`❌ Could not edit join message for battle ${battleId}:`, error.message);
          }
        }
      }
    }
  }
}

// Save data to file
function savePandaCoinData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(pandaCoinData, null, 2));
    console.log('✅ Data saved to file successfully');
  } catch (error) {
    console.error('Error saving panda coin data:', error);
  }
}

// Reload data from file
function reloadPandaCoinData() {
  try {
    if (fs.existsSync(dataFile)) {
      pandaCoinData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      console.log('✅ Data reloaded from file successfully');
      return true;
    }
  } catch (error) {
    console.error('Error reloading panda coin data:', error);
  }
  return false;
}

// Save role milestones data
function saveRoleMilestones() {
  try {
    fs.writeFileSync(rolesFile, JSON.stringify(roleMilestones, null, 2));
  } catch (error) {
    console.error('Error saving role milestones data:', error);
  }
}

// Save suggestion channels data
function saveSuggestionChannels() {
  try {
    fs.writeFileSync(suggestionsFile, JSON.stringify(suggestionChannels, null, 2));
  } catch (error) {
    console.error('Error saving suggestion channels data:', error);
  }
}

// Mana system - tracks player mana for dungeon battles
function getUserMana(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, inventory: {}, gear: {}, pets: {}, equipped: {}, archive: {}, pursuit: null, mana: 100, lastManaRegen: Date.now(), countdownStart: Date.now() };
  }
  
  // Calculate mana regeneration since last check
  const now = Date.now();
  const lastRegen = pandaCoinData[userId].lastManaRegen || now;
  const timeDiff = now - lastRegen;
  const minutesPassed = Math.floor(timeDiff / 60000); // 1 mana per minute
  
  // Debug logging for mana regeneration
  if (minutesPassed > 0) {
    console.log(`🔮 Mana regen calculation for ${userId}:`);
    console.log(`  - Time since last regen: ${Math.floor(timeDiff / 1000)}s`);
    console.log(`  - Minutes passed: ${minutesPassed}`);
    console.log(`  - Last regen time: ${new Date(lastRegen).toLocaleString()}`);
    console.log(`  - Current time: ${new Date(now).toLocaleString()}`);
  }
  
  if (minutesPassed > 0) {
    const currentMana = pandaCoinData[userId].mana || 100;
    const newMana = Math.min(100, currentMana + minutesPassed);
    pandaCoinData[userId].mana = newMana;
    // Update lastManaRegen to the time when regeneration occurred, not current time
    pandaCoinData[userId].lastManaRegen = lastRegen + (minutesPassed * 60000);
    // Reset countdown timer when mana regenerates
    pandaCoinData[userId].countdownStart = now;
    savePandaCoinData();
    console.log(`🔮 Mana regen for ${userId}: +${minutesPassed} mana (${currentMana} → ${newMana})`);
    console.log(`  - Updated lastManaRegen to: ${new Date(pandaCoinData[userId].lastManaRegen).toLocaleString()}`);
    console.log(`  - Reset countdown timer to: ${new Date(pandaCoinData[userId].countdownStart).toLocaleString()}`);
  }
  
  return pandaCoinData[userId].mana || 100;
}

function spendMana(userId, amount) {
  const currentMana = getUserMana(userId);
  if (currentMana >= amount) {
    pandaCoinData[userId].mana = currentMana - amount;
    savePandaCoinData();
    console.log(`🔮 Mana spent for ${userId}: -${amount} mana (${currentMana} → ${currentMana - amount})`);
    return true;
  }
  console.log(`🔮 Insufficient mana for ${userId}: ${currentMana}/${amount} required`);
  return false;
}

function addMana(userId, amount) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, inventory: {}, gear: {}, pets: {}, equipped: {}, archive: {}, pursuit: null, mana: 100, lastManaRegen: Date.now(), countdownStart: Date.now() };
  }
  
  // Get current time for regeneration tracking
  const now = Date.now();
  
  // If lastManaRegen doesn't exist, set it to now
  if (!pandaCoinData[userId].lastManaRegen) {
    pandaCoinData[userId].lastManaRegen = now;
  }
  
  // If countdownStart doesn't exist, set it to now
  if (!pandaCoinData[userId].countdownStart) {
    pandaCoinData[userId].countdownStart = now;
  }
  
  pandaCoinData[userId].mana = Math.min(100, (pandaCoinData[userId].mana || 100) + amount);
  
  // Don't update lastManaRegen or countdownStart when using potions - let natural regeneration continue
  // This ensures the regeneration timer doesn't get reset by potion use
  
  savePandaCoinData();
  console.log(`🔮 Mana added for ${userId}: +${amount} mana (potions don't affect natural regen timer)`);
}

// Pursuit system - tracks what items users are pursuing for luck bonuses
const pursuitsFile = './pursuits.json';
let pursuitData = {};
try {
  if (fs.existsSync(pursuitsFile)) {
    pursuitData = JSON.parse(fs.readFileSync(pursuitsFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading pursuit data, starting fresh');
  pursuitData = {};
}

// Save pursuit data
function savePursuitData() {
  try {
    fs.writeFileSync(pursuitsFile, JSON.stringify(pursuitData, null, 2));
  } catch (error) {
    console.error('Error saving pursuit data:', error);
  }
}

// Set user's pursued item
function setPursuit(userId, itemName) {
  if (!pursuitData[userId]) {
    pursuitData[userId] = {};
  }
  pursuitData[userId].pursuedItem = itemName.toLowerCase();
  pursuitData[userId].setAt = Date.now();
  savePursuitData();
}

// Get user's pursued item
function getPursuit(userId) {
  return pursuitData[userId] ? pursuitData[userId].pursuedItem : null;
}

// Calculate luck bonus for specific item drop
function getLuckDropBonus(userId, itemName) {
  const pursuedItem = getPursuit(userId);
  if (!pursuedItem) return 0;

  // Check if the dropped item matches the pursued item
  const normalizedItemName = itemName.toLowerCase();
  const normalizedPursuedItem = pursuedItem.toLowerCase();

  // Handle special cases for pursuit matching
  if (normalizedPursuedItem === 'bunny' && normalizedItemName === 'bunny pet') {
    const playerStats = getUserStats(userId);
    return playerStats.luck * 0.15;
  } else if (normalizedItemName === normalizedPursuedItem) {
    const playerStats = getUserStats(userId);
    return playerStats.luck * 0.15;
  }

  return 0;
}

// Set role milestone for guild
function setRoleMilestone(guildId, coins, roleId) {
  if (!roleMilestones[guildId]) {
    roleMilestones[guildId] = {};
  }
  roleMilestones[guildId][coins] = roleId;
  saveRoleMilestones();
}

// Check and assign roles based on user's coin count
async function checkAndAssignRoles(userId, guildId, guild) {
  if (!roleMilestones[guildId]) return;

  const userCoins = getUserCoins(userId);
  const member = await guild.members.fetch(userId);

  // Get all milestones for this guild, sorted by coin amount (descending)
  const milestones = Object.entries(roleMilestones[guildId])
    .map(([coins, roleId]) => ({ coins: parseInt(coins), roleId }))
    .sort((a, b) => b.coins - a.coins);

  // Find the highest milestone the user qualifies for
  let targetRole = null;
  for (const milestone of milestones) {
    if (userCoins >= milestone.coins) {
      targetRole = milestone;
      break;
    }
  }

  // If user qualifies for a role, assign it (and remove lower milestone roles)
  if (targetRole) {
    try {
      const role = guild.roles.cache.get(targetRole.roleId);
      if (role && !member.roles.cache.has(targetRole.roleId)) {
        await member.roles.add(role);

        // Remove lower milestone roles
        for (const milestone of milestones) {
          if (milestone.coins < targetRole.coins) {
            const lowerRole = guild.roles.cache.get(milestone.roleId);
            if (lowerRole && member.roles.cache.has(milestone.roleId)) {
              await member.roles.remove(lowerRole);
            }
          }
        }

        return role;
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  }

  return null;
}

// Get user's panda coins
function getUserCoins(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {} };
  }
  return pandaCoinData[userId].coins;
}

// Get user's inventory
function getUserInventory(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, archive: {} };
  }
  if (!pandaCoinData[userId].inventory) {
    pandaCoinData[userId].inventory = {};
  }
  if (!pandaCoinData[userId].gear) {
    pandaCoinData[userId].gear = {
      weapon: {},
      helmet: {},
      armor: {},
      ride: {}
    };
  }
  return pandaCoinData[userId].inventory;
}

// Get user's gear
function getUserGear(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, equipped: {}, archive: {} };
  }
  if (!pandaCoinData[userId].gear) {
    pandaCoinData[userId].gear = {
      weapon: {},
      helmet: {},
      armor: {},
      ride: {}
    };
  }
  if (!pandaCoinData[userId].equipped) {
    pandaCoinData[userId].equipped = {
      weapon: null,
      helmet: null,
      armor: null,
      ride: null
    };
  }
  return pandaCoinData[userId].gear;
}

// Get user's equipped gear
function getUserEquipped(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, equipped: {}, archive: {} };
  }
  if (!pandaCoinData[userId].equipped) {
    pandaCoinData[userId].equipped = {
      weapon: null,
      helmet: null,
      armor: null,
      ride: null
    };
  }
  return pandaCoinData[userId].equipped;
}

// Get user's pets
function getUserPets(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, equipped: {}, pets: {}, equippedPet: null, archive: {} };
  }
  if (!pandaCoinData[userId].pets) {
    pandaCoinData[userId].pets = {};
  }
  return pandaCoinData[userId].pets;
}

// Get user's equipped pet
function getUserEquippedPet(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, equipped: {}, pets: {}, equippedPet: null, archive: {} };
  }
  return pandaCoinData[userId].equippedPet;
}

// Equip pet
function equipPet(userId, petName) {
  const pets = getUserPets(userId);
  if (!pets[petName]) {
    return false;
  }

  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, gear: {}, equipped: {}, pets: {}, equippedPet: null, archive: {} };
  }
  pandaCoinData[userId].equippedPet = petName;
  savePandaCoinData();
  return true;
}

// Add pet to user's collection
function addPetToInventory(userId, petName, quantity = 1) {
  const pets = getUserPets(userId);
  if (!pets[petName]) {
    pets[petName] = 0;
  }
  pets[petName] += quantity;
  
  // Mark pet as discovered in archive
  markItemDiscovered(userId, petName);
  
  savePandaCoinData();
}

// Equip gear
function equipGear(userId, category, itemName) {
  if (!hasGear(userId, category, itemName)) {
    return false;
  }

  const equipped = getUserEquipped(userId);
  equipped[category] = itemName;
  savePandaCoinData();
  return true;
}

// Add gear to user's collection
function addGearToInventory(userId, gearType, gearName, quantity = 1) {
  const gear = getUserGear(userId);
  if (!gear[gearType][gearName]) {
    gear[gearType][gearName] = 0;
  }
  gear[gearType][gearName] += quantity;
  
  // Mark gear as discovered in archive
  markItemDiscovered(userId, gearName);
  
  savePandaCoinData();
}

// Remove gear from user's collection
function removeGearFromInventory(userId, gearType, gearName, quantity = 1) {
  const gear = getUserGear(userId);
  if (gear[gearType][gearName] && gear[gearType][gearName] >= quantity) {
    gear[gearType][gearName] -= quantity;
    if (gear[gearType][gearName] <= 0) {
      delete gear[gearType][gearName];
    }
    savePandaCoinData();
    return true;
  }
  return false;
}

// Check if user has gear
function hasGear(userId, gearType, gearName, quantity = 1) {
  const gear = getUserGear(userId);
  return gear[gearType] && gear[gearType][gearName] && gear[gearType][gearName] >= quantity;
}

// Gear stats database
const gearStats = {
  weapon: {
    axe: { attack: 1 },
    'goblin arm': { attack: 3, slapChance: 20 },
    'knight\'s rusty blade': { attack: 7, defense: 3 },
    'bow & arrow': { attack: 4, headshotChance: 20 },
    'fortified steel waraxe': { attack: 12, defense: 2 },
    'Broken Ancient Dual Blades': { attack: 15, speed: 2 }
  },
          helmet: {
          'goblin mask': { defense: 1, health: 1 },
          'knight\'s rusty helmet': { defense: 3 },
          'old worn helmet': { defense: 1, health: 2 },
          'shiny reindeer antlers': { defense: 5, health: 9, luck: 2 },
          'fortified steel helmet': { defense: 6, health: 3 },
          'Broken Ancient Helmet': { defense: 9, health: 9 }
        },
  armor: {
    'goblin clothing': { defense: 2, health: 1 },
    'knight\'s rusty armor': { defense: 6, health: 3 },
    'old worn armor': { defense: 1, health: 1 },
    'fortified steel armor': { defense: 10, health: 5 },
    'Broken Ancient Armor': { health: 10, defense: 9 }
  },
  ride: {
    horse: { speed: 2 },
    'Cerberus': { attack: 2, speed: 6 }
  }
};

// Pet stats database
const petStats = {
  'goblin pet': { luck: 3 },
  'bunny pet': { luck: 5 },
  'knight companion': { defense: 1, luck: 3 },
  'Golden Puppy': { luck: 6 }
};

// Gear set bonuses
const gearSetBonuses = {
  'The Rusty Knight\'s Bonus': {
    name: 'The Rusty Knight\'s Bonus',
    description: 'Wearing the complete Rusty Knight set grants additional health',
    requiredItems: {
      helmet: 'knight\'s rusty helmet',
      weapon: 'knight\'s rusty blade',
      armor: 'knight\'s rusty armor'
    },
    bonuses: {
      health: 10
    }
  },
  'The Fortified Steel\'s Bonus': {
    name: 'The Fortified Steel\'s Bonus',
    description: 'Wearing the complete Fortified Steel set grants additional health and defense',
    requiredItems: {
      helmet: 'fortified steel helmet',
      weapon: 'fortified steel waraxe',
      armor: 'fortified steel armor'
    },
    bonuses: {
      health: 8,
      defense: 5
    }
  },
  'The Broken Ancient\'s Bonus': {
    name: 'The Broken Ancient\'s Bonus',
    description: 'Wearing the complete Broken Ancient set grants massive health and attack bonuses',
    requiredItems: {
      helmet: 'Broken Ancient Helmet',
      weapon: 'Broken Ancient Dual Blades',
      armor: 'Broken Ancient Armor'
    },
    bonuses: {
      health: 12,
      attack: 6
    }
  }
};

// Check if user has active gear set bonuses
function getActiveGearSetBonuses(userId) {
  const equipped = getUserEquipped(userId);
  const activeBonuses = [];

  Object.entries(gearSetBonuses).forEach(([setName, setData]) => {
    let hasCompleteSet = true;

    // Check if all required items are equipped
    Object.entries(setData.requiredItems).forEach(([slot, requiredItem]) => {
      if (equipped[slot] !== requiredItem) {
        hasCompleteSet = false;
      }
    });

    if (hasCompleteSet) {
      activeBonuses.push(setData);
    }
  });

  return activeBonuses;
}

// Merchant selling prices
const merchantPrices = {
  'goblin tooth': 3,
  'skull': 2,
  'sock': 1,
  'knight\'s jewel': 10,
  'broken blade': 5,
  'reindeer skin': 2,
  'wolf pelt': 4,
  'bear claw': 8,
  'golden deer antler': 15,
  'orc\'s eyeball': 10,
  'orc\'s hidden jewel': 25,
  'Giant\'s Jewel': 24,
  'Giant\'s Massive Club': 8
};

// Merchant buying inventory (items the merchant sells to players)
const merchantInventory = {
  'small potion': {
    price: 4,
    description: 'Restores 3 health during battle (cannot exceed max health)',
    unlockCondition: 'defeat_goblin' // Must defeat The Goblin to unlock
  },
  'small mana potion': {
    price: 8,
    description: 'Restores 20 mana for dungeon battles (cannot exceed max mana)',
    unlockCondition: 'defeat_goblin' // Must defeat The Goblin to unlock
  }
};

// Item emote system - add emotes here as you create them
const itemEmotes = {
  // Pets (add your custom pet emotes here)
                    'bunny pet': '<:bunny_pet:1402000280790499449>', // Custom animated bunny pet emote
  'goblin pet': '<:goblin_pet:1401989695348670524>', // Custom animated goblin pet emote
  'knight companion': '<:knight_companion:1402008551500546170>', // Custom knight companion pet emote
  
  // Hunting items (add your custom hunting emotes here)
  'shiny reindeer antlers': '<:shiny_antlers:1402014761499230398>', // Custom animated shiny reindeer antlers emote
  'golden deer antler': '🦌✨', // Replace with <:golden_antler:EMOTE_ID> when you create it
  'wolf pelt': '🐺', // Replace with <:wolf_pelt:EMOTE_ID> when you create it
  'bear claw': '🐻', // Replace with <:bear_claw:EMOTE_ID> when you create it
  'reindeer skin': '🦌', // Replace with <:reindeer_skin:EMOTE_ID> when you create it
  
  // Gear items (add your custom gear emotes here)
  'shiny reindeer antlers': '<:shiny_antlers:1402014761499230398>', // Custom animated shiny reindeer antlers emote
  'old worn helmet': '🪖', // Replace with <:old_helmet:EMOTE_ID> when you create it
  'old worn armor': '🛡️', // Replace with <:old_armor:EMOTE_ID> when you create it
  'goblin mask': '🪖', // Replace with <:goblin_mask:EMOTE_ID> when you create it
  'goblin clothing': '🛡️', // Replace with <:goblin_clothing:EMOTE_ID> when you create it
  'goblin arm': '⚔️', // Replace with <:goblin_arm:EMOTE_ID> when you create it
  'axe': '<:axe:1400990115555311758>', // Already using custom emote
  'bow & arrow': '🏹', // Replace with <:bow_arrow:EMOTE_ID> when you create it
  
  // Tools
  'shovel': '🔨', // Replace with <:shovel:EMOTE_ID> when you create it
  'spear': '🏹', // Replace with <:spear:EMOTE_ID> when you create it
  
  // Materials
  'skull': '💀', // Replace with <:skull:EMOTE_ID> when you create it
  'sock': '🧦', // Replace with <:sock:EMOTE_ID> when you create it
  'goblin tooth': '🦷', // Replace with <:goblin_tooth:EMOTE_ID> when you create it
  'knight\'s jewel': '💎', // Replace with <:knight_jewel:EMOTE_ID> when you create it
  'broken blade': '🗡️', // Replace with <:broken_blade:EMOTE_ID> when you create it
  'Giant\'s Jewel': '💎✨', // Replace with custom emote when created
  'Giant\'s Massive Club': '🏏', // Replace with custom emote when created
  
  // Default fallback
  'default': '📦'
};

// Helper function to get item emote
function getItemEmote(itemName) {
  return itemEmotes[itemName] || itemEmotes['default'];
}

// Helper function to get item display with emote
function getItemDisplay(itemName, quantity = 1) {
  const emote = getItemEmote(itemName);
  return `${emote} **${itemName}** x${quantity}`;
}

// Check if player has unlocked merchant items
function hasMerchantUnlock(userId, unlockCondition) {
  if (unlockCondition === 'defeat_goblin') {
    // Check if player has any goblin-related items (indicating they've defeated The Goblin)
    const gear = getUserGear(userId);
    const inventory = getUserInventory(userId);
    const pets = getUserPets(userId);

    return !!(
      (gear.weapon && gear.weapon['goblin arm']) ||
      (gear.helmet && gear.helmet['goblin mask']) ||
      (gear.armor && gear.armor['goblin clothing']) ||
      inventory['goblin tooth'] ||
      pets['goblin pet']
    );
  }
  return false;
}

// Item database for inspection
const itemDatabase = {
  // Weapons
  'axe': {
    category: 'weapon',
    emoji: '<:axe:1400990115555311758>',
    description: 'A basic weapon that provides attack power but has a chance to miss.',
    stats: { attack: 1 },
    uses: 'Equip to increase your attack damage in battles. Has a 30% miss chance when attacking.',
    obtainedFrom: '🛒 **Shop:** Purchase for 1 Panda Coin\n💰 **Daily:** Claim daily rewards for free coins\n⚔️ **Dungeon:** Earn coins by defeating enemies',
    rarity: 'common'
  },
  'goblin arm': {
    category: 'weapon',
    emoji: '⚔️',
    description: 'A crude weapon torn from a defeated goblin. Powerful but unreliable with a vicious slap attack.',
    stats: { attack: 3, slapChance: 20 },
    uses: 'Equip to deal 3 damage with 30% miss chance. 20% chance for "Slap across the face" dealing 4-5 damage.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (20% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'uncommon'
  },
  'bow & arrow': {
    category: 'weapon',
    emoji: '🏹',
    description: 'A precise ranged weapon capable of delivering devastating headshots.',
    stats: { attack: 4, headshotChance: 20 },
    uses: 'Equip to deal 4 base damage with 20% chance for headshot (5-7 damage). Ideal for defeating The Knight.',
    obtainedFrom: '🛒 **Shop:** Purchase for 40 Panda Coins\n💰 **Farming:** Defeat The Goblin multiple times (13 coins per fight)\n⚔️ **Alternative:** Use Goblin Arm + luck to defeat The Knight',
    rarity: 'rare'
  },

  // Helmets
  'goblin mask': {
    category: 'helmet',
    emoji: '🪖',
    description: 'A grotesque mask that provides protection and vitality.',
    stats: { defense: 1, health: 1 },
    uses: 'Equip to increase your defense and health stats.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (20% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'uncommon'
  },
  'old worn helmet': {
    category: 'helmet',
    emoji: '🪖',
    description: 'A battered helmet that has seen better days but still provides basic protection.',
    stats: { defense: 1, health: 2 },
    uses: 'Equip to increase your defense and health stats. Perfect for new players!',
    obtainedFrom: '⛏️ **Digging:** 8% chance with shovels\n🛒 **Shop:** Buy shovels for 3 Panda Coins\n💰 **Daily:** Get free coins to buy shovels',
    rarity: 'common'
  },
  'shiny reindeer antlers': {
    category: 'helmet',
    emoji: '🦌✨',
    description: 'Magical antlers from a mystical reindeer. Radiates with ancient power and good fortune.',
    stats: { defense: 5, health: 9, luck: 2 },
    uses: 'Equip to gain massive health, defense, and luck bonuses. The rarest hunting trophy!',
    obtainedFrom: '🏹 **Hunting:** 0.3% chance with spears (extremely rare!)\n🛒 **Shop:** Buy spears for 6 Panda Coins\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'mythical'
  },

  // Armor
  'goblin clothing': {
    category: 'armor',
    emoji: '🛡️',
    description: 'Tattered clothing that surprisingly offers good protection.',
    stats: { defense: 2, health: 1 },
    uses: 'Equip to significantly boost your defense and health.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (5% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'old worn armor': {
    category: 'armor',
    emoji: '🛡️',
    description: 'Worn and weathered armor that provides basic protection for new adventurers.',
    stats: { defense: 1, health: 1 },
    uses: 'Equip to increase your defense and health stats. Great starter gear!',
    obtainedFrom: '⛏️ **Digging:** 8% chance with shovels\n🛒 **Shop:** Buy shovels for 3 Panda Coins\n💰 **Daily:** Get free coins to buy shovels',
    rarity: 'common'
  },

  // Hunting Items
  'reindeer skin': {
    category: 'material',
    emoji: '🦌',
    description: 'A soft, warm skin from a majestic reindeer. Valuable to merchants.',
    stats: {},
    uses: 'Sell to the merchant for 2 Panda Coins.',
    obtainedFrom: '🏹 **Hunting:** 45% chance with spears\n🛒 **Shop:** Buy spears for 6 Panda Coins\n💰 **Merchant:** Sell for 2 Panda Coins',
    rarity: 'common'
  },
  'wolf pelt': {
    category: 'material',
    emoji: '🐺',
    description: 'A thick, durable pelt from a fierce wolf. Highly valued by merchants.',
    stats: {},
    uses: 'Sell to the merchant for 4 Panda Coins.',
    obtainedFrom: '🏹 **Hunting:** 8% chance with spears\n🛒 **Shop:** Buy spears for 6 Panda Coins\n💰 **Merchant:** Sell for 4 Panda Coins',
    rarity: 'uncommon'
  },
  'bear claw': {
    category: 'material',
    emoji: '🐻',
    description: 'A sharp, powerful claw from a massive bear. Very valuable to merchants.',
    stats: {},
    uses: 'Sell to the merchant for 8 Panda Coins.',
    obtainedFrom: '🏹 **Hunting:** 5% chance with spears\n🛒 **Shop:** Buy spears for 6 Panda Coins\n💰 **Merchant:** Sell for 8 Panda Coins',
    rarity: 'rare'
  },
  'golden deer antler': {
    category: 'material',
    emoji: '🦌✨',
    description: 'A magnificent golden antler from a legendary deer. Extremely rare and valuable.',
    stats: {},
    uses: 'Sell to the merchant for 15 Panda Coins.',
    obtainedFrom: '🏹 **Hunting:** 2% chance with spears (very rare!)\n🛒 **Shop:** Buy spears for 6 Panda Coins\n💰 **Merchant:** Sell for 15 Panda Coins\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'legendary'
  },

  // Rides
  'horse': {
    category: 'ride',
    emoji: '🐎',
    description: 'A majestic steed that enhances your agility and movement.',
    stats: { speed: 2 },
    uses: 'Equip to increase your speed, providing dodge chance in battles (2% per speed point).',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (0.5% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'extremely rare'
  },

  // Pets
  'goblin pet': {
    category: 'pet',
    emoji: '👹',
    description: 'A small, loyal goblin companion that brings you luck.',
    stats: { luck: 3 },
    uses: 'Equip to increase your luck, improving enemy miss chances and potentially affecting future features.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (5% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'bunny pet': {
    category: 'pet',
    emoji: '🐰',
    description: 'An adorable bunny that hops alongside you, bringing exceptional fortune.',
    stats: { luck: 5 },
    uses: 'Equip to significantly increase your luck, greatly improving enemy miss chances.',
    obtainedFrom: '⛏️ **Digging:** Extremely rare find with shovels\n🛒 **Shop:** Buy shovels for 3 Panda Coins\n💰 **Daily:** Get free coins to buy shovels\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'extremely rare'
  },

  // Tools & Items
  'shovel': {
    category: 'tool',
    emoji: '🔨',
    description: 'A sturdy digging tool used to unearth hidden treasures.',
    stats: {},
    uses: 'Use with /dig command to search for treasures underground. Has 3 uses before breaking.',
    obtainedFrom: '🛒 **Shop:** Purchase for 3 Panda Coins\n💰 **Daily:** Claim daily rewards for free coins\n⚔️ **Dungeon:** Earn coins by defeating enemies',
    rarity: 'common'
  },
  'spear': {
    category: 'tool',
    emoji: '🏹',
    description: 'A sharp hunting spear for tracking and catching wild animals.',
    stats: {},
    uses: 'Use with /hunt command to hunt animals in the forest. Has 3 uses before breaking.',
    obtainedFrom: '🛒 **Shop:** Purchase for 6 Panda Coins\n💰 **Daily:** Claim daily rewards for free coins\n⚔️ **Dungeon:** Earn coins by defeating enemies',
    rarity: 'common'
  },
  'sock': {
    category: 'treasure',
    emoji: '🧦',
    description: 'A random sock found buried underground. Not very valuable but common.',
    stats: {},
    uses: 'Collection item with no current gameplay purpose. May have uses in future updates.',
    obtainedFrom: '⛏️ **Digging:** Common find with shovels\n🛒 **Shop:** Buy shovels for 3 Panda Coins\n💰 **Daily:** Get free coins to buy shovels',
    rarity: 'very common'
  },
  'skull': {
    category: 'treasure',
    emoji: '💀',
    description: 'An ominous skull from an unknown creature. Might be valuable to collectors.',
    stats: {},
    uses: 'Collection item with no current gameplay purpose. May have uses in future updates.',
    obtainedFrom: '⛏️ **Digging:** Uncommon find with shovels\n🛒 **Shop:** Buy shovels for 3 Panda Coins\n💰 **Daily:** Get free coins to buy shovels',
    rarity: 'uncommon'
  },
  'goblin tooth': {
    category: 'treasure',
    emoji: '🦷',
    description: 'A sharp tooth from a defeated goblin. Proof of your victory.',
    stats: {},
    uses: 'Collection item and trophy. May be used for crafting or trading in future updates.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Goblin (50% drop chance)\n💪 **Strategy:** Use /dungeon goblin to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'common'
  },

  // Knight Items
  'broken blade': {
    category: 'treasure',
    emoji: '🗡️',
    description: 'A shattered blade from a knight\'s weapon that broke during battle.',
    stats: {},
    uses: 'Collection item and trophy. Can be sold to The Merchant for 5 Panda Coins or used for crafting in future updates.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (50% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights\n💰 **Merchant:** Sell for 5 Panda Coins',
    rarity: 'common'
  },
  'knight\'s rusty blade': {
    category: 'weapon',
    emoji: '⚔️',
    description: 'A battle-worn but sturdy blade that survived the knight\'s defeat. Provides both offense and defense.',
    stats: { attack: 7, defense: 3 },
    uses: 'Equip to significantly boost attack power and gain defensive capabilities. A rare dual-stat weapon.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (15% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights\n⚔️ **Exclusive:** Cannot get both Broken Blade and Knight\'s Rusty Blade',
    rarity: 'rare'
  },
  'knight\'s rusty armor': {
    category: 'armor',
    emoji: '🛡️',
    description: 'Heavy armor worn by a defeated knight. Provides excellent protection and vitality.',
    stats: { defense: 6, health: 3 },
    uses: 'Equip to greatly increase your defense and health stats.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (20% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'knight\'s rusty helmet': {
    category: 'helmet',
    emoji: '⛑️',
    description: 'A sturdy helmet that protected a knight in many battles.',
    stats: { defense: 3 },
    uses: 'Equip to boost your defense significantly.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (10% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'uncommon'
  },
  'knight\'s jewel': {
    category: 'treasure',
    emoji: '💎',
    description: 'A precious gemstone carried by the knight. Radiates with mysterious energy.',
    stats: {},
    uses: 'Collection item with unknown properties. May have special uses in future updates.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (4% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'knight companion': {
    category: 'pet',
    emoji: '🐴',
    description: 'A loyal companion that once served alongside the knight. Provides protection and fortune.',
    stats: { defense: 1, luck: 3 },
    uses: 'Equip to gain defensive capabilities and improved luck for better outcomes.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Knight (0.45% drop chance)\n💪 **Strategy:** Use /dungeon knight to fight\n⏰ **Cooldown:** 30 minutes between fights\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'extremely rare'
  },
  'small potion': {
    category: 'consumable',
    emoji: '🧪',
    description: 'A small vial of healing liquid that can restore health during battle.',
    stats: {},
    uses: 'Use during battle to restore 3 health points. Cannot exceed your maximum health.',
    obtainedFrom: '🛒 **Merchant:** Purchase for 4 Panda Coins\n⚔️ **Unlock:** Defeat The Goblin first\n💰 **Farming:** Defeat The Goblin multiple times (13 coins per fight)',
    rarity: 'common'
  },
  'small mana potion': {
    category: 'consumable',
    emoji: '🔮',
    description: 'A small vial of magical essence that restores mana for dungeon battles.',
    stats: {},
    uses: 'Use to restore 20 mana points. Cannot exceed your maximum mana of 100.',
    obtainedFrom: '🛒 **Merchant:** Purchase for 8 Panda Coins\n💰 **Cost:** 8 coins per potion (no profit from farming)',
    rarity: 'common'
  },

  // Orc Items
  'orc\'s eyeball': {
    category: 'material',
    emoji: '👁️',
    description: 'A gruesome trophy from a defeated orc. Valuable to merchants.',
    stats: {},
    uses: 'Sell to the merchant for 10 Panda Coins.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (50% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights\n💰 **Merchant:** Sell for 10 Panda Coins',
    rarity: 'common'
  },
  'orc\'s hidden jewel': {
    category: 'material',
    emoji: '💎',
    description: 'A precious gemstone hidden by the orc. Extremely valuable.',
    stats: {},
    uses: 'Sell to the merchant for 25 Panda Coins.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (4.5% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights\n💰 **Merchant:** Sell for 25 Panda Coins',
    rarity: 'rare'
  },
  'fortified steel waraxe': {
    category: 'weapon',
    emoji: '⚔️',
    description: 'A massive steel waraxe forged with superior craftsmanship. Devastating in battle.',
    stats: { attack: 12, defense: 2 },
    uses: 'Equip to gain massive attack power and defensive capabilities. The ultimate melee weapon.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (10% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'fortified steel armor': {
    category: 'armor',
    emoji: '🛡️',
    description: 'Heavy steel armor reinforced with additional plating. Provides exceptional protection.',
    stats: { defense: 10, health: 5 },
    uses: 'Equip to gain massive defense and health bonuses. The pinnacle of armor protection.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (20% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'rare'
  },
  'fortified steel helmet': {
    category: 'helmet',
    emoji: '🪖',
    description: 'A sturdy steel helmet with reinforced construction. Offers superior head protection.',
    stats: { defense: 6, health: 3 },
    uses: 'Equip to significantly boost defense and health. Excellent head protection.',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (15% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights',
    rarity: 'uncommon'
  },
  'orc mount': {
    category: 'ride',
    emoji: '🐗',
    description: 'A fierce orc war boar trained for battle. Provides exceptional speed and intimidation.',
    stats: { speed: 4 },
    uses: 'Equip to greatly increase your speed, providing enhanced dodge chance in battles (4% per speed point).',
    obtainedFrom: '⚔️ **Dungeon:** Defeat The Orc (0.5% drop chance)\n💪 **Strategy:** Use /dungeon orc to fight\n⏰ **Cooldown:** 30 minutes between fights\n🍀 **Luck:** Use /charm to increase drop chances',
    rarity: 'extremely rare'
  },
  'Giant\'s Jewel': {
    category: 'material',
    emoji: '💎✨',
    description: 'A magnificent jewel from The Crazy Giant. Radiates with ancient power and immense value.',
    stats: {},
    uses: 'Sell to the merchant for 24 Panda Coins.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (20% drop chance)\n👥 **Team:** Requires 2-4 players\n💰 **Merchant:** Sell for 24 Panda Coins',
    rarity: 'rare'
  },
  'Giant\'s Massive Club': {
    category: 'material',
    emoji: '🏏',
    description: 'A massive club wielded by The Crazy Giant. Heavy and valuable to collectors.',
    stats: {},
    uses: 'Sell to the merchant for 8 Panda Coins.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (20% drop chance)\n👥 **Team:** Requires 2-4 players\n💰 **Merchant:** Sell for 8 Panda Coins',
    rarity: 'uncommon'
  },
  'Broken Ancient Dual Blades': {
    category: 'weapon',
    emoji: '⚔️',
    description: 'Ancient dual blades that once belonged to a legendary warrior. Extremely sharp and deadly.',
    stats: { attack: 15, speed: 2 },
    uses: 'Equip to gain massive attack power and speed bonuses. The ultimate dual-wielding weapon.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (12% drop chance)\n👥 **Team:** Requires 2-4 players\n⚔️ **Exclusive:** Rare multiplayer boss drop',
    rarity: 'legendary'
  },
  'Broken Ancient Armor': {
    category: 'armor',
    emoji: '🛡️',
    description: 'Ancient armor forged with forgotten techniques. Provides exceptional protection and vitality.',
    stats: { health: 10, defense: 9 },
    uses: 'Equip to gain massive health and defense bonuses. The pinnacle of ancient armor.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (12% drop chance)\n👥 **Team:** Requires 2-4 players\n⚔️ **Exclusive:** Rare multiplayer boss drop',
    rarity: 'legendary'
  },
  'Broken Ancient Helmet': {
    category: 'helmet',
    emoji: '🪖',
    description: 'An ancient helmet crafted with lost techniques. Offers superior protection and vitality.',
    stats: { defense: 9, health: 9 },
    uses: 'Equip to gain massive defense and health bonuses. The ultimate head protection.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (12% drop chance)\n👥 **Team:** Requires 2-4 players\n⚔️ **Exclusive:** Rare multiplayer boss drop',
    rarity: 'legendary'
  },
  'Cerberus': {
    category: 'ride',
    emoji: '🐕',
    description: 'A legendary three-headed dog from ancient mythology. Provides exceptional speed and attack power.',
    stats: { attack: 2, speed: 6 },
    uses: 'Equip to greatly increase your speed and attack power. The ultimate mythical mount.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (3.5% drop chance)\n👥 **Team:** Requires 2-4 players\n⚔️ **Exclusive:** Extremely rare multiplayer boss drop',
    rarity: 'mythical'
  },
  'Golden Puppy': {
    category: 'pet',
    emoji: '🐕✨',
    description: 'A magical golden puppy with extraordinary luck. Brings immense fortune to its owner.',
    stats: { luck: 6 },
    uses: 'Equip to gain massive luck bonuses, greatly improving enemy miss chances and drop rates.',
    obtainedFrom: '⚔️ **Multiplayer:** Defeat The Crazy Giant (0.5% drop chance)\n👥 **Team:** Requires 2-4 players\n⚔️ **Exclusive:** Extremely rare multiplayer boss drop',
    rarity: 'mythical'
  }
};

// Enemy database
const enemies = {
  goblin: {
    name: 'The Goblin',
    level: 1,
    cost: 10,
    manaCost: 10,
    health: 5,
    damage: 1,
    criticalChance: 15, // 15% chance for critical hit (double damage)
    emoji: '👹',
    rewards: {
      coins: 13,
      drops: [
        { item: 'goblin tooth', type: 'inventory', chance: 50 },
        { item: 'goblin arm', type: 'weapon', chance: 20 },
        { item: 'goblin mask', type: 'helmet', chance: 20 },
        { item: 'goblin clothing', type: 'armor', chance: 5 },
        { item: 'goblin pet', type: 'pet', chance: 5 },
        { item: 'horse', type: 'ride', chance: 0.5 }
      ]
    }
  },
  knight: {
    name: 'The Knight',
    level: 2,
    cost: 30,
    manaCost: 20,
    health: 12,
    damage: 2,
    criticalChance: 10, // 10% chance for critical hit (double damage)
    emoji: '⚔️',
    rewards: {
      coins: 40,
      drops: [
        { item: 'broken blade', type: 'inventory', chance: 50, exclusive: 'blade' },
        { item: 'knight\'s rusty blade', type: 'weapon', chance: 15, exclusive: 'blade' },
        { item: 'knight\'s rusty armor', type: 'armor', chance: 20 },
        { item: 'knight\'s rusty helmet', type: 'helmet', chance: 10 },
        { item: 'knight\'s jewel', type: 'inventory', chance: 4 },
        { item: 'knight companion', type: 'pet', chance: 0.45 }
      ]
    }
  },
  orc: {
    name: 'The Orc',
    level: 3,
    cost: 50,
    manaCost: 30,
    health: 28,
    damage: 4,
    criticalChance: 18, // 18% chance for critical hit (double damage)
    emoji: '👹',
    rewards: {
      coins: 70,
      drops: [
        { item: 'orc\'s eyeball', type: 'inventory', chance: 50 },
        { item: 'orc\'s eyeball', type: 'inventory', chance: 5, quantity: 2 }, // 5% chance for 2 eyeballs
        { item: 'fortified steel armor', type: 'armor', chance: 20 },
        { item: 'fortified steel helmet', type: 'helmet', chance: 15 },
        { item: 'fortified steel waraxe', type: 'weapon', chance: 10 },
        { item: 'orc\'s hidden jewel', type: 'inventory', chance: 4.5 },
        { item: 'orc mount', type: 'ride', chance: 0.5 }
      ]
    }
  }
};

// Battle system functions
function calculateDamage(attackerDamage, defenderDefense) {
  // Defense reduces damage by percentage with diminishing returns
  // Formula: damage * (100 / (100 + defense))
  const damageReduction = defenderDefense / (100 + defenderDefense);
  const finalDamage = Math.ceil(attackerDamage * (1 - damageReduction));
  return Math.max(1, finalDamage); // Always take at least 1 damage
}

function calculateMissChance(playerLuck) {
  // Base 5% miss chance + 1% per luck point (max 25%)
  return Math.min(25, 5 + playerLuck);
}

function calculateDodgeChance(playerSpeed) {
  // 2% dodge chance per speed point (max 20%)
  return Math.min(20, playerSpeed * 2);
}

function rollMiss(missChance) {
  return Math.random() * 100 < missChance;
}

function rollDodge(dodgeChance) {
  return Math.random() * 100 < dodgeChance;
}

function rollCritical(criticalChance) {
  return Math.random() * 100 < criticalChance;
}

// Battle state management
const activeBattles = new Map();

// Store last purchase message for each user (to prevent chat flooding)
const lastPurchaseMessages = new Map();

// Store last ephemeral message for each user (for shop purchases)
const lastEphemeralMessages = new Map();

// Dungeon cooldown tracking (30 minutes = 1800000 ms)
const dungeonCooldownsFile = './dungeon-cooldowns.json';
let dungeonCooldowns = {};
const DUNGEON_COOLDOWN_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Load existing cooldown data
try {
  if (fs.existsSync(dungeonCooldownsFile)) {
    dungeonCooldowns = JSON.parse(fs.readFileSync(dungeonCooldownsFile, 'utf8'));
  }
} catch (error) {
  console.log('Error loading dungeon cooldown data, starting fresh');
  dungeonCooldowns = {};
}

// Function to check if user is on cooldown for a specific enemy
function isOnDungeonCooldown(userId, enemyType) {
  const cooldownKey = `${userId}_${enemyType}`;
  const lastFight = dungeonCooldowns[cooldownKey];
  
  if (!lastFight) {
    console.log(`⏰ No cooldown found for user ${userId} on enemy ${enemyType}`);
    return false; // No cooldown if never fought
  }
  
  const timeSinceLastFight = Date.now() - lastFight;
  const isOnCooldown = timeSinceLastFight < DUNGEON_COOLDOWN_TIME;
  console.log(`⏰ Cooldown check for user ${userId} on enemy ${enemyType}: ${isOnCooldown ? 'ON COOLDOWN' : 'NOT ON COOLDOWN'} (${Math.floor(timeSinceLastFight / 1000)}s since last fight)`);
  return isOnCooldown;
}

// Function to get remaining cooldown time
function getDungeonCooldownRemaining(userId, enemyType) {
  const cooldownKey = `${userId}_${enemyType}`;
  const lastFight = dungeonCooldowns[cooldownKey];
  
  if (!lastFight) {
    return 0; // No cooldown
  }
  
  const timeSinceLastFight = Date.now() - lastFight;
  const remainingTime = DUNGEON_COOLDOWN_TIME - timeSinceLastFight;
  
  return remainingTime > 0 ? remainingTime : 0;
}

// Function to set cooldown for a user after fighting an enemy
function setDungeonCooldown(userId, enemyType) {
  const cooldownKey = `${userId}_${enemyType}`;
  dungeonCooldowns[cooldownKey] = Date.now();
  
  // Save cooldown data to file
  try {
    fs.writeFileSync(dungeonCooldownsFile, JSON.stringify(dungeonCooldowns, null, 2));
    console.log(`⏰ Cooldown set for user ${userId} on enemy ${enemyType} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error saving dungeon cooldown data:', error);
  }
}

// Function to format cooldown time for display
function formatCooldownTime(milliseconds) {
  const minutes = Math.floor(milliseconds / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
  return `${minutes}m ${seconds}s`;
}

function initiateBattle(userId, enemyType) {
  const enemy = enemies[enemyType];
  if (!enemy) return null;

  const playerStats = getUserStats(userId);
  console.log(`🎯 Battle initialization for ${userId}:`);
  console.log(`  - Calculated playerStats:`, playerStats);
  
  const battleState = {
    enemyType,
    enemy,
    playerHealth: playerStats.health,
    playerMaxHealth: playerStats.health,
    enemyHealth: enemy.health,
    enemyMaxHealth: enemy.health,
    playerStats,
    turn: 1,
    isPlayerTurn: false, // Enemy attacks first
    battleLog: [],
    rewards: []
  };

  // Get enemy emoji based on enemy type
  const enemyEmoji = enemy.name === 'The Goblin' ? '👹' : '⚔️';
  battleState.battleLog.push(`⚔️ **Battle Start!** ${enemyEmoji} ${enemy.name} vs 🏆 You`);
  battleState.battleLog.push(`${enemyEmoji} Enemy Health: ${battleState.enemyHealth} | 🏆 Your Health: ${battleState.playerHealth}`);
  battleState.battleLog.push(`\n**Turn ${battleState.turn}:** ${enemy.name} attacks first!`);

  // Enemy's first attack
  const enemyAttackResult = processEnemyAttack(battleState);
  battleState.battleLog.push(...enemyAttackResult.log);

  if (battleState.playerHealth <= 0) {
    battleState.battleLog.push(`\n💀 **DEFEAT!** You have been slain by ${enemy.name}!`);
    // No cooldown on defeat - enemy is still alive
    return { 
      type: 'battle_end', 
      victory: false, 
      battleLog: battleState.battleLog, 
      rewards: [] 
    };
  }

  battleState.isPlayerTurn = true;
  battleState.turn++;

  // Store battle state
activeBattles.set(userId, battleState);

  return {
    type: 'awaiting_attack',
    battleState,
    attackOptions: getAttackOptions(userId)
  };
}

function getAttackOptions(userId) {
  const equipped = getUserEquipped(userId);
  const weapon = equipped.weapon;
  const inventory = getUserInventory(userId);

  const attacks = [
    {
      id: 'basic_attack',
      name: '🗡️ Basic Attack',
      description: 'Standard attack with your equipped weapon',
      damage: 'Variable',
      special: weapon ? getWeaponSpecial(weapon) : null
    }
  ];

  // Add weapon-specific attacks
  if (weapon === 'goblin arm') {
    attacks.push({
      id: 'berserker_rage',
      name: '💢 Berserker Rage',
      description: 'Wild attack with 50% more damage but 40% miss chance',
      damage: 'High',
      special: 'High risk, high reward'
    });
  } else if (weapon === 'bow & arrow') {
    attacks.push({
      id: 'aimed_shot',
      name: '🎯 Aimed Shot',
      description: 'Careful shot with guaranteed hit but takes 2 turns',
      damage: 'Moderate',
      special: 'Never misses, multi-turn'
    });
  } else if (weapon === 'knight\'s rusty blade') {
    attacks.push({
      id: 'defensive_strike',
      name: '🛡️ Defensive Strike',
      description: 'Attack while defending, reduces incoming damage next turn',
      damage: 'Moderate',
      special: 'Grants defense bonus'
    });
  }

  // Add potion option if available
  if (inventory['small potion'] && inventory['small potion'] > 0) {
    attacks.push({
      id: 'use_potion',
      name: '🧪 Use Small Potion',
      description: 'Restore 3 health (cannot exceed max health)',
      damage: 'Healing',
      special: 'Restores health'
    });
  }



  return attacks;
}

function getWeaponSpecial(weapon) {
  const specials = {
    'axe': '30% miss chance',
    'goblin arm': '20% slap chance (4-5 dmg)',
    'bow & arrow': '20% headshot chance (5-7 dmg)',
    'knight\'s rusty blade': 'Balanced offense and defense'
  };
  return specials[weapon] || 'No special effects';
}

function processPlayerAttack(userId, attackId) {
  const battleState = activeBattles.get(userId);
  if (!battleState || !battleState.isPlayerTurn) {
    return { error: 'No active battle or not your turn!' };
  }

  const attackLog = [];
  let skipEnemyTurn = false;
  let grantDefenseBonus = false;

  // Add dynamic atmosphere message at start of turn
  const goblinMessages = [
    "The Goblin snarls menacingly as you prepare your attack",
    "The Goblin's eyes dart nervously as battle continues",
    "The Goblin brandishes his crude weapon with wild abandon",
    "The Goblin's breathing becomes more ragged with each exchange",
    "The Goblin lets out a guttural growl of defiance",
    "The Goblin stumbles but regains his footing quickly",
    "The Goblin's wounds are beginning to show",
    "The Goblin wipes green blood from his scarred face",
    "The Goblin's grip tightens desperately on his weapon",
    "The Goblin's fury intensifies as the battle drags on"
  ];

  const knightMessages = [
    "The Knight adjusts his stance with practiced precision",
    "The Knight's armor gleams despite the battle's intensity",
    "The Knight maintains perfect form even as fatigue sets in",
    "The Knight's breathing echoes steadily from within his helmet",
    "The Knight raises his weapon with unwavering determination",
    "The Knight's movements remain calculated and methodical",
    "The Knight shows the discipline of countless battles",
    "The Knight's armor bears new dents from your attacks",
    "The Knight shifts his weight, preparing for your next move",
    "The Knight's eyes gleam with battle-tested resolve",
    "The Knight grips his weapon with both hands confidently",
    "The Knight's stance speaks of years of combat training"
  ];

  const orcMessages = [
    "The Orc snarls and bares his tusks menacingly",
    "The Orc's muscles ripple as he prepares to strike",
    "The Orc lets out a guttural war cry",
    "The Orc's eyes burn with savage fury",
    "The Orc grips his weapon with primal strength",
    "The Orc's scars tell tales of brutal battles",
    "The Orc's breathing is heavy with bloodlust",
    "The Orc's stance is wild and unpredictable",
    "The Orc's rage intensifies with each passing moment",
    "The Orc's movements are fierce and untamed",
    "The Orc's weapon thirsts for more blood",
    "The Orc's primal instincts guide his every move"
  ];

  if (attackId === 'use_potion') {
    attackLog.push(`\n**Turn ${battleState.turn}:** Your turn!`);
    
    // Check if player has potion
    if (!removeItemFromInventory(userId, 'small potion', 1)) {
      return { error: 'You don\'t have any Small Potions!' };
    }

    // Heal the player
    const healAmount = Math.min(3, battleState.playerMaxHealth - battleState.playerHealth);
    battleState.playerHealth += healAmount;
    
    // Simple potion messages
    const potionMessages = [
      "🧪 You quickly drink a Small Potion!",
      "🧪 You gulp down the healing potion!",
      "🧪 You sip the Small Potion carefully!",
      "🧪 You chug the potion in one go!",
      "🧪 You carefully drink the Small Potion!"
    ];
    
    const randomMessage = potionMessages[Math.floor(Math.random() * potionMessages.length)];
    attackLog.push(randomMessage);
    attackLog.push(`🏆 Your Health: ${battleState.playerHealth}/${battleState.playerMaxHealth}`);
    
    // Simple enemy reaction
    if (battleState.enemy.name === 'The Goblin') {
      attackLog.push("👹 The Goblin growls at your healing!");
    } else if (battleState.enemy.name === 'The Orc') {
      attackLog.push("👹 The Orc snarls at your healing!");
    } else {
      attackLog.push("⚔️ The Knight watches you drink the potion.");
    }
    
    // Continue with normal battle flow instead of returning early
    battleState.battleLog.push(...attackLog);
    
    // Enemy's turn
    battleState.isPlayerTurn = false;
    battleState.turn++;

    const enemyAttackResult = processEnemyAttack(battleState, false);
    battleState.battleLog.push(...enemyAttackResult.log);

    if (battleState.playerHealth <= 0) {
      attackLog.push(`\n💀 **DEFEAT!** You have been slain by ${battleState.enemy.name}!`);
      
      // No cooldown on defeat - enemy is still alive
      activeBattles.delete(userId);
      return {
        type: 'battle_end',
        victory: false,
        battleLog: [...battleState.battleLog, ...attackLog],
        rewards: []
      };
    }

    battleState.isPlayerTurn = true;
    battleState.turn++;

    // Update battle state
    activeBattles.set(userId, battleState);

    return {
      type: 'awaiting_attack',
      battleState,
      attackOptions: getAttackOptions(userId),
      battleLog: battleState.battleLog
    };
  } else {
    attackLog.push(`\n**Turn ${battleState.turn}:** Your turn!`);
    
    // Get appropriate atmosphere message for non-potion attacks
    let messages;
    if (battleState.enemy.name === 'The Goblin') {
      messages = goblinMessages;
    } else if (battleState.enemy.name === 'The Orc') {
      messages = orcMessages;
    } else {
      messages = knightMessages;
    }
    const messageIndex = (battleState.turn - 1) % messages.length;
    const atmosphereMessage = messages[messageIndex];
    
    attackLog.push(`⚔️ ${atmosphereMessage}`);
    
    // Process attack
    const equippedWeapon = getUserEquipped(userId).weapon;
    let playerDamage = battleState.playerStats.attack;
    let playerMissed = false;
    let isSpecial = false;
    let specialType = '';

    if (attackId === 'basic_attack') {
      // Standard weapon attacks
      if ((equippedWeapon === 'axe' || equippedWeapon === 'goblin arm') && Math.random() < 0.3) {
        playerMissed = true;
      }

      // Check for weapon special attacks
      if (equippedWeapon === 'goblin arm' && Math.random() * 100 < 20) {
        isSpecial = true;
        specialType = 'slap';
        playerDamage = Math.random() < 0.8 ? 4 : 5;
      } else if (equippedWeapon === 'bow & arrow' && Math.random() * 100 < 20) {
        isSpecial = true;
        specialType = 'headshot';
        playerDamage = Math.floor(Math.random() * 3) + 5;
      }
    } else if (attackId === 'berserker_rage') {
      // Goblin arm special attack
      playerDamage = Math.floor(battleState.playerStats.attack * 1.5);
      if (Math.random() < 0.4) {
        playerMissed = true;
      }
      specialType = 'berserker';
    } else if (attackId === 'aimed_shot') {
      // Bow special attack - never misses, guaranteed damage
      playerDamage = battleState.playerStats.attack + 2;
      specialType = 'aimed';
      skipEnemyTurn =true; // Takes 2 turns
    } else if (attackId === 'defensive_strike') {
      // knight blade special - moderate damage, defense bonus
      playerDamage = Math.floor(battleState.playerStats.attack * 0.8);
      specialType = 'defensive';
      grantDefenseBonus = true;
    }

    if (playerMissed) {
      attackLog.push(`💨 Your ${attackId.replace('_', ' ')} missed!`);
    } else {
      const damage = calculateDamage(playerDamage, 0);
      battleState.enemyHealth -= damage;

      if (specialType === 'slap') {
        attackLog.push(`💥👋 **SLAP ACROSS THE FACE!** Your goblin arm delivers a vicious slap for ${damage} damage!`);
      } else if (specialType === 'headshot') {
        attackLog.push(`🎯💥 **HEADSHOT!** Perfect shot for ${damage} damage!`);
      } else if (specialType === 'berserker') {
        // Use enemy-specific berserker emoji
        const berserkerEmoji = battleState.enemy.name === 'The Goblin' ? '💢👊' : '💢⚔️';
        attackLog.push(`${berserkerEmoji} **BERSERKER RAGE!** Wild attack for ${damage} damage!`);
      } else if (specialType === 'aimed') {
        attackLog.push(`🎯🏹 **AIMED SHOT!** Carefully aimed attack for ${damage} damage! (Enemy loses next turn)`);
      } else if (specialType === 'defensive') {
        attackLog.push(`🛡️⚔️ **DEFENSIVE STRIKE!** Balanced attack for ${damage} damage! (Defense bonus next turn)`);
      } else {
        // Use enemy-specific attack emoji
        const attackEmoji = battleState.enemy.name === 'The Goblin' ? '👊' : '⚔️';
        attackLog.push(`${attackEmoji} You attack for ${damage} damage!`);
      }

      attackLog.push(`${battleState.enemy.emoji} Enemy Health: ${Math.max(0, battleState.enemyHealth)}`);
    }
  }

  // Check if enemy is defeated
  if (battleState.enemyHealth <= 0) {
    attackLog.push(`\n🎉 **VICTORY!** You have defeated ${battleState.enemy.name}!`);

    // Process rewards
    const rewards = processVictoryRewards(userId, battleState.enemy);
    attackLog.push(`\n🎁 **Rewards Earned:**\n${rewards.join('\n')}`);

    // Mana system - no cooldown needed, mana regenerates naturally
    console.log(`🔮 Mana system active - no cooldown for user ${userId} on enemy ${battleState.enemyType} (victory)`);

    activeBattles.delete(userId);
    return {
      type: 'battle_end',
      victory: true,
      battleLog: [...battleState.battleLog, ...attackLog],
      rewards
    };
  }

  battleState.battleLog.push(...attackLog);

  if (skipEnemyTurn) {
    attackLog.push(`\n⏭️ ${battleState.enemy.name} is stunned and loses their turn!`);
    battleState.isPlayerTurn = true;
    battleState.turn++;
  } else {
    // Enemy's turn
    battleState.isPlayerTurn = false;
    battleState.turn++;

    const enemyAttackResult = processEnemyAttack(battleState, grantDefenseBonus);
    battleState.battleLog.push(...enemyAttackResult.log);

    if (battleState.playerHealth <= 0) {
      attackLog.push(`\n💀 **DEFEAT!** You have been slain by ${battleState.enemy.name}!`);
      
      // No cooldown on defeat - enemy is still alive
      activeBattles.delete(userId);
      return {
        type: 'battle_end',
        victory: false,
        battleLog: [...battleState.battleLog, ...attackLog],
        rewards: []
      };
    }

    battleState.isPlayerTurn = true;
    battleState.turn++;
  }

  // Update battle state
  activeBattles.set(userId, battleState);

  return {
    type: 'awaiting_attack',
    battleState,
    attackOptions: getAttackOptions(userId),
    battleLog: battleState.battleLog
  };
}

function processEnemyAttack(battleState, playerHasDefenseBonus = false) {
  const attackLog = [];
  attackLog.push(`\n**Turn ${battleState.turn}:** ${battleState.enemy.name}'s turn!`);

  const missChance = calculateMissChance(battleState.playerStats.luck);
  const dodgeChance = calculateDodgeChance(battleState.playerStats.speed);
  const missed = rollMiss(missChance);
  const dodged = rollDodge(dodgeChance);

  if (missed) {
    attackLog.push(`💨 ${battleState.enemy.name} missed their attack!`);
  } else if (dodged) {
    attackLog.push(`⚡ You dodged ${battleState.enemy.name}'s attack with your speed!`);
  } else {
    let enemyDamage = battleState.enemy.damage;
    let isCritical = false;

    // Check for critical hit
    if (battleState.enemy.criticalChance && rollCritical(battleState.enemy.criticalChance)) {
      enemyDamage *= 2;
      isCritical = true;
    }

    // Apply defense bonus if player used defensive strike
    let playerDefense = battleState.playerStats.defense;
    if (playerHasDefenseBonus) {
      playerDefense += 3;
      attackLog.push(`🛡️ Your defensive stance reduces incoming damage!`);
    }

    const damage = calculateDamage(enemyDamage, playerDefense);
    battleState.playerHealth -= damage;

    if (isCritical) {
      attackLog.push(`💥💥 **CRITICAL HIT!** ${battleState.enemy.name} strikes for ${damage} damage!`);
    } else {
      attackLog.push(`💥 ${battleState.enemy.name} attacks for ${damage} damage!`);
    }
    attackLog.push(`🏆 Your Health: ${Math.max(0, battleState.playerHealth)}/${battleState.playerMaxHealth}`);
  }

  return { log: attackLog };
}

function processVictoryRewards(userId, enemy) {
  const rewards = [];

  // Give guaranteed coins
  addCoins(userId, enemy.rewards.coins);
  rewards.push(`💰 ${enemy.rewards.coins} Panda Coins`);

  // Roll for item drops (handle exclusive groups) with pursuit bonuses
  const exclusiveGroups = {};

  enemy.rewards.drops.forEach(drop => {
    if (drop.exclusive) {
      if (!exclusiveGroups[drop.exclusive]) {
        exclusiveGroups[drop.exclusive] = [];
      }
      exclusiveGroups[drop.exclusive].push(drop);
    } else {
      // Non-exclusive drops with luck bonus
      const luckBonus = getLuckDropBonus(userId, drop.item);
      const enhancedChance = drop.chance + luckBonus;

      if (Math.random() * 100 < enhancedChance) {
        let rewardText = '';
        if (drop.type === 'inventory') {
          addItemToInventory(userId, drop.item, 1);
          rewardText = `📦 ${drop.item}`;
        } else if (drop.type === 'pet') {
          addPetToInventory(userId, drop.item, 1);
          rewardText = `🐾 ${drop.item}`;
        } else {
          addGearToInventory(userId, drop.type, drop.item, 1);
          rewardText = `⚔️ ${drop.item}`;
        }

        if (luckBonus > 0) {
          rewardText += ` *(+${luckBonus.toFixed(2)}% luck bonus)*`;
        }
        rewards.push(rewardText);
      }
    }
  });

  // Handle exclusive groups (only one item per group can drop) with pursuit bonuses
  Object.values(exclusiveGroups).forEach(group => {
    const roll = Math.random() * 100;
    let cumulativeChance = 0;

    for (const drop of group) {
      const luckBonus = getLuckDropBonus(userId, drop.item);
      const enhancedChance = drop.chance + luckBonus;
      cumulativeChance += enhancedChance;

      if (roll < cumulativeChance) {
        let rewardText = '';
        if (drop.type === 'inventory') {
          addItemToInventory(userId, drop.item, 1);
          rewardText = `📦 ${drop.item}`;
        } else if (drop.type === 'pet') {
          addPetToInventory(userId, drop.item, 1);
          rewardText = `🐾 ${drop.item}`;
        } else {
          addGearToInventory(userId, drop.type, drop.item, 1);
          rewardText = `⚔️ ${drop.item}`;
        }

        if (luckBonus > 0) {
          rewardText += ` *(+${luckBonus.toFixed(2)}% luck bonus)*`;
        }
        rewards.push(rewardText);
        break;
      }
    }
  });

  // Track goblin defeat for quest
  if (enemy.name === 'The Goblin') {
    updateGoblinDefeat(userId);
  }
  
  // Track orc defeat for quest
  if (enemy.name === 'The Orc') {
    updateOrcDefeat(userId);
  }

  // Add experience based on enemy mana cost (EXP = Mana Cost × 2)
  const expGained = enemy.manaCost * 2;
  const levelUpInfo = addExperience(userId, expGained);
  rewards.push(`⭐ ${expGained} Experience Points`);
  
  // Add level-up notification if player leveled up
  if (levelUpInfo.leveledUp) {
    rewards.push(`🎉 **LEVEL UP!** You reached level ${levelUpInfo.newLevel}!`);
  }

  return rewards;
}

// Calculate user's total stats from equipped gear and pets
function getUserStats(userId) {
  console.log(`🚨 getUserStats called with userId: ${userId}`);
  
  const equipped = getUserEquipped(userId);
  const equippedPet = getUserEquippedPet(userId);
  const stats = {
    health: 5, // Base health
    attack: 0,
    defense: 0,
    speed: 0,
    luck: 0
  };

  // Debug logging
  console.log(`🔍 Debug getUserStats for ${userId}:`);
  console.log(`  - Equipped gear:`, equipped);
  console.log(`  - Equipped pet:`, equippedPet);

  // Add stats from equipped gear
  Object.entries(equipped).forEach(([gearType, itemName]) => {
    console.log(`  - Checking ${gearType}: ${itemName}`);
    if (itemName && gearStats[gearType] && gearStats[gearType][itemName]) {
      const itemStats = gearStats[gearType][itemName];
      console.log(`  - Found stats for ${itemName}:`, itemStats);
      stats.attack += itemStats.attack || 0;
      stats.defense += itemStats.defense || 0;
      stats.health += itemStats.health || 0;
      stats.speed += itemStats.speed || 0;
      stats.luck += itemStats.luck || 0;
    } else {
      console.log(`  - No stats found for ${itemName} in ${gearType}`);
      console.log(`  - gearStats[${gearType}]:`, gearStats[gearType]);
    }
  });

  // Add stats from equipped pet
  if (equippedPet && petStats[equippedPet]) {
    const petStatBonus = petStats[equippedPet];
    stats.attack += petStatBonus.attack || 0;
    stats.defense += petStatBonus.defense || 0;
    stats.health += petStatBonus.health || 0;
    stats.speed += petStatBonus.speed || 0;
    stats.luck += petStatBonus.luck || 0;
  }

  // Add gear set bonuses
  const activeSetBonuses = getActiveGearSetBonuses(userId);
  activeSetBonuses.forEach(setBonus => {
    stats.attack += setBonus.bonuses.attack || 0;
    stats.defense += setBonus.bonuses.defense || 0;
    stats.health += setBonus.bonuses.health || 0;
    stats.speed += setBonus.bonuses.speed || 0;
    stats.luck += setBonus.bonuses.luck || 0;
  });

  console.log(`  - Final calculated stats:`, stats);
  return stats;
}

// Add item to user's inventory
function addItemToInventory(userId, itemName, quantity = 1) {
  const inventory = getUserInventory(userId);
  if (!inventory[itemName]) {
    inventory[itemName] = 0;
  }
  inventory[itemName] += quantity;
  
  // Mark item as discovered in archive
  markItemDiscovered(userId, itemName);
  
  savePandaCoinData();
}

// Remove item from user's inventory
function removeItemFromInventory(userId, itemName, quantity = 1) {
  const inventory = getUserInventory(userId);
  if (inventory[itemName] && inventory[itemName] >= quantity) {
    inventory[itemName] -= quantity;
    if (inventory[itemName] <= 0) {
      delete inventory[itemName];
    }
    savePandaCoinData();
    return true;
  }
  return false;
}

// Check if user has item
function hasItem(userId, itemName, quantity = 1) {
  const inventory = getUserInventory(userId);
  return inventory[itemName] && inventory[itemName] >= quantity;
}

// Remove coins from user
function removeCoins(userId, amount) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {} };
  }
  if (pandaCoinData[userId].coins >= amount) {
    pandaCoinData[userId].coins -= amount;
    savePandaCoinData();
    return true;
  }
  return false;
}

// Remove stamina from user
function removeStamina(userId, amount) {
  console.log(`🔍 DEBUG: removeStamina called with userId: ${userId}, amount: ${amount}`);
  
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0, stamina: 100 };
    console.log(`🔍 DEBUG: Initialized pandaCoinData for userId: ${userId}`);
  }
  
  console.log(`🔍 DEBUG: Current stamina: ${pandaCoinData[userId].stamina} (type: ${typeof pandaCoinData[userId].stamina})`);
  console.log(`🔍 DEBUG: Stamina >= amount check: ${pandaCoinData[userId].stamina} >= ${amount} = ${pandaCoinData[userId].stamina >= amount}`);
  
  if (pandaCoinData[userId].stamina >= amount) {
    pandaCoinData[userId].stamina -= amount;
    console.log(`🔍 DEBUG: Stamina deducted: ${pandaCoinData[userId].stamina + amount} - ${amount} = ${pandaCoinData[userId].stamina}`);
    savePandaCoinData();
    return true;
  }
  console.log(`🔍 DEBUG: Not enough stamina to deduct`);
  return false;
}

// Add stamina to user
function addStamina(userId, amount) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0, stamina: 100 };
  }
  pandaCoinData[userId].stamina += amount;
  savePandaCoinData();
  return true;
}

// Add coins to user
function addCoins(userId, amount, guild = null) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0, stamina: 100 };
  }
  pandaCoinData[userId].coins += amount;
  savePandaCoinData();

  // Check for role assignments if guild is provided
  if (guild) {
    checkAndAssignRoles(userId, guild.id, guild).catch(error => {
      console.error('Error checking role assignments:', error);
    });
  }
}

// Check if user can claim daily reward
function canClaimDaily(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0 };
  }
  const now = Date.now();
  const lastDaily = pandaCoinData[userId].lastDaily;
  const fiveHours = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

  return (now - lastDaily) >= fiveHours;
}

// Update last daily claim time
function updateLastDaily(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0 };
  }
  pandaCoinData[userId].lastDaily = Date.now();
  savePandaCoinData();
}

// Archive tracking functions
function getUserArchive(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0 };
  }
  if (!pandaCoinData[userId].archive) {
    pandaCoinData[userId].archive = {};
  }
  return pandaCoinData[userId].archive;
}

// Mark item as discovered in archive
function markItemDiscovered(userId, itemName) {
  const archive = getUserArchive(userId);
  if (!archive[itemName]) {
    archive[itemName] = {
      discovered: true,
      discoveredAt: Date.now()
    };
    savePandaCoinData();
  }
}

// Check if item is discovered
function isItemDiscovered(userId, itemName) {
  const archive = getUserArchive(userId);
  return archive[itemName] && archive[itemName].discovered;
}

// Level system functions
function getUserLevel(userId) {
  if (!pandaCoinData[userId]) {
    pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {}, level: 1, exp: 0 };
  }
  if (!pandaCoinData[userId].level) {
    pandaCoinData[userId].level = 1;
  }
  if (!pandaCoinData[userId].exp) {
    pandaCoinData[userId].exp = 0;
  }
  return {
    level: pandaCoinData[userId].level,
    exp: pandaCoinData[userId].exp
  };
}

// Calculate experience required for next level
function getExpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Add experience and handle level-ups
function addExperience(userId, expAmount) {
  const userData = getUserLevel(userId);
  const currentLevel = userData.level;
  const currentExp = userData.exp;
  
  // Add experience
  pandaCoinData[userId].exp = currentExp + expAmount;
  
  // Check for level-ups
  let newLevel = currentLevel;
  let expForNextLevel = getExpForLevel(currentLevel);
  let remainingExp = pandaCoinData[userId].exp;
  
  while (remainingExp >= expForNextLevel) {
    remainingExp -= expForNextLevel;
    newLevel++;
    expForNextLevel = getExpForLevel(newLevel);
  }
  
  // Update level and remaining exp
  pandaCoinData[userId].level = newLevel;
  pandaCoinData[userId].exp = remainingExp;
  
  savePandaCoinData();
  
  // Return level-up info
  return {
    leveledUp: newLevel > currentLevel,
    oldLevel: currentLevel,
    newLevel: newLevel,
    expGained: expAmount,
    expForNext: getExpForLevel(newLevel),
    currentExp: remainingExp
  };
}

// Get level progress information
function getLevelProgress(userId) {
  const userData = getUserLevel(userId);
  const expForNext = getExpForLevel(userData.level);
  
  return {
    level: userData.level,
    currentExp: userData.exp,
    expForNext: expForNext,
    progress: (userData.exp / expForNext) * 100
  };
}

// Define slash commands
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!'
  },
  {
    name: 'pocket',
    description: 'Claim your Panda Coins reward (every 5 hours)!'
  },
  {
    name: 'wallet',
    description: 'Check your Panda Coins balance'
  },
  {
    name: 'balance',
    description: 'Check your Panda Coins balance'
  },
  {
    name: 'shop',
    description: 'Browse the shop to buy items with Panda Coins'
  },
  {
    name: 'inventory',
    description: 'Check your inventory'
  },
  {
    name: 'dig',
    description: 'Use your shovel to dig for treasures!'
  },
  {
    name: 'hunt',
    description: 'Use your spear to hunt animals in the forest!'
  },
  {
    name: 'mute',
    description: 'Mute a user for 10 minutes',
    options: [
      {
        name: 'user',
        description: 'The user to mute',
        type: 6,
        required: true
      }
    ]
  },
  {
    name: 'unmute',
    description: 'Unmute a user',
    options: [
      {
        name: 'user',
        description: 'The user to unmute',
        type: 6,
        required: true
      }
    ]
  },
  {
    name: 'setrole',
    description: 'Set a role milestone for when users reach a certain amount of Panda Coins',
    options: [
      {
        name: 'coins',
        description: 'Number of Panda Coins required',
        type: 4,
        required: true
      },
      {
        name: 'role',
        description: 'The role to assign',
        type: 8,
        required: true
      }
    ]
  },
  {
    name: 'milestones',
    description: 'View all role milestones for this server'
  },
  {
    name: 'help',
    description: 'Get detailed help instructions sent to your DMs'
  },
  {
    name: 'equip',
    description: 'Equip gear to your character',
    options: [
      {
        name: 'category',
        description: 'The gear category (weapon, helmet, armor, ride)',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Weapon',
            value: 'weapon'
          },
          {
            name: 'Helmet',
            value: 'helmet'
          },
          {
            name: 'Armor',
            value: 'armor'
          },
          {
            name: 'Ride',
            value: 'ride'
          },
          {
            name: 'Pet',
            value: 'pet'
          }
        ]
      },
      {
        name: 'item',
        description: 'The item name to equip',
        type: 3,
        required: true,
        autocomplete: true
      }
    ]
  },
  {
    name: 'unequip',
    description: 'Unequip gear from your character',
    options: [
      {
        name: 'category',
        description: 'The gear category to unequip',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Weapon',
            value: 'weapon'
          },
          {
            name: 'Helmet',
            value: 'helmet'
          },
          {
            name: 'Armor',
            value: 'armor'
          },
          {
            name: 'Ride',
            value: 'ride'
          },
          {
            name: 'Pet',
            value: 'pet'
          }
        ]
      },
      {
        name: 'item',
        description: 'The item name to unequip (optional - will unequip whatever is equipped)',
        type: 3,
        required: false,
        autocomplete: true
      }
    ]
  },
  {
    name: 'player',
    description: 'View your character stats (health, attack, defense, speed)'
  },
  {
    name: 'pet',
    description: 'View your equipped pet and pet collection'
  },
  {
    name: 'dungeon',
    description: 'Enter the dungeon to fight enemies and collect gear (30min cooldown per enemy)'
  },

  {
    name: 'grant',
    description: 'Grant a role to a user (Admin only)',
    options: [
      {
        name: 'user',
        description: 'The user to grant the role to',
        type: 6,
        required: true
      },
      {
        name: 'role',
        description: 'The role to grant',
        type: 8,
        required: true
      }
    ]
  },
  {
    name: 'pandaboard',
    description: 'View leaderboards for Panda Coins or Power rankings',
    options: [
      {
        name: 'type',
        description: 'What to rank by',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Panda Coins',
            value: 'coins'
          },
          {
            name: 'Power',
            value: 'power'
          }
        ]
      },
      {
        name: 'scope',
        description: 'Server-only or global rankings',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Server Only',
            value: 'server'
          },
          {
            name: 'Global',
            value: 'global'
          }
        ]
      }
    ]
  },
  {
    name: 'setsuggestion',
    description: 'Set the suggestions channel for this server (Admin only)',
    options: [
      {
        name: 'channel',
        description: 'The channel where suggestions will be posted',
        type: 7,
        required: true
      }
    ]
  },
  {
    name: 'suggestion',
    description: 'Submit a suggestion to the suggestions channel',
    options: [
      {
        name: 'text',
        description: 'Your suggestion',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'addsuggestion',
    description: 'Add a suggestion from a message to the suggestions channel (Admin only)',
    options: [
      {
        name: 'message_id',
        description: 'The ID of the message to add as a suggestion (right-click message → Copy Message ID)',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'suggestioncomplete',
    description: 'Mark a suggestion as completed (Admin only)',
    options: [
      {
        name: 'message_id',
        description: 'The ID of the suggestion message to mark as completed',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'suggestiondeny',
    description: 'Mark a suggestion as denied (Admin only)',
    options: [
      {
        name: 'message_id',
        description: 'The ID of the suggestion message to mark as denied',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'inspect',
    description: 'Get detailed information about any item in the game',
    options: [
      {
        name: 'category',
        description: 'The category of items to browse',
        type: 3,
        required: true,
        choices: [
          { name: 'Helmets & Headgear', value: 'helmets' },
          { name: 'Body Armor', value: 'armor' },
          { name: 'Weapons & Tools', value: 'weapons' },
          { name: 'Pets & Companions', value: 'pets' },
          { name: 'Materials & Resources', value: 'materials' },
          { name: 'Consumables & Potions', value: 'consumables' },
          { name: 'Mounts & Rides', value: 'mounts' }
        ]
      },
      {
        name: 'item',
        description: 'The name of the item to inspect',
        type: 3,
        required: true,
        autocomplete: true
      }
    ]
  },
  {
    name: 'inspectplayer',
    description: 'Inspect another player\'s stats and equipment',
    options: [
      {
        name: 'user',
        description: 'The user to inspect (mention, ID, or username)',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'merchant',
    description: 'Trade with The Merchant to buy or sell items',
    options: [
      {
        name: 'mode',
        description: 'Choose buying or selling mode',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Selling Mode',
            value: 'sell'
          },
          {
            name: 'Buying Mode',
            value: 'buy'
          }
        ]
      }
    ]
  },
  {
    name: 'charm',
    description: 'Target a specific item to increase your luck bonuses for that item',
    options: [
      {
        name: 'category',
        description: 'The category of items to browse',
        type: 3,
        required: true,
        choices: [
          { name: 'Helmets & Headgear', value: 'helmets' },
          { name: 'Body Armor', value: 'armor' },
          { name: 'Weapons & Tools', value: 'weapons' },
          { name: 'Pets & Companions', value: 'pets' },
          { name: 'Materials & Resources', value: 'materials' },
          { name: 'Consumables & Potions', value: 'consumables' },
          { name: 'Mounts & Rides', value: 'mounts' }
        ]
      },
      {
        name: 'item',
        description: 'The item you want to pursue for luck bonuses',
        type: 3,
        required: true,
        autocomplete: true
      }
    ]
  },
  {
    name: 'gift',
    description: 'Gift Panda Coins to another user with 10% tax',
    options: [
      {
        name: 'user',
        description: 'The user to gift coins to',
        type: 6,
        required: true
      },
      {
        name: 'amount',
        description: 'Number of Panda Coins to gift (minimum 10)',
        type: 4,
        required: true
      }
    ]
  },
  {
    name: 'archive',
    description: 'Browse the grand archive to discover all items in the game'
  },
  {
    name: 'use',
    description: 'Use a consumable item from your inventory',
    options: [
      {
        name: 'item',
        description: 'The consumable item to use',
        type: 3,
        required: true,
        autocomplete: true
      }
    ]
  },
    {
    name: 'reload',
    description: 'Reload data from file (admin only)'
  },
  {
    name: 'quest',
    description: 'View your active quests and progress',
    options: [
      {
        name: 'mode',
        description: 'Type of quest to view',
        type: 3,
        required: true,
        choices: [
          {
            name: 'Story Quests',
            value: 'story'
          }
        ]
      }
    ]
  },
  {
    name: 'dungeonmulti',
    description: 'Multiplayer dungeon battles with friends'
  },

  {
    name: 'battle',
    description: 'Check battle status or attack in multiplayer battles'
  }
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
    console.log(`Registering ${commands.length} commands globally...`);

    // Register commands globally for better compatibility
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log(`Successfully reloaded ${commands.length} application (/) commands globally.`);
    console.log('Commands registered:', commands.map(cmd => cmd.name).join(', '));
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
  console.log('Interaction received:', interaction.type, interaction.commandName);
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isAutocomplete()) return;
  
  if (interaction.isCommand()) {
    console.log('Processing command:', interaction.commandName);
  }

  // Handle autocomplete interactions
  if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    
    if (commandName === 'inspect' || commandName === 'charm') {
      const focusedValue = interaction.options.getFocused();
      const category = interaction.options.getString('category');
      
      // Define items by category (same as archive pages)
      const categoryItems = {
        helmets: ['goblin mask', 'knight\'s rusty helmet', 'old worn helmet', 'shiny reindeer antlers', 'fortified steel helmet', 'Broken Ancient Helmet'],
        armor: ['goblin clothing', 'knight\'s rusty armor', 'old worn armor', 'fortified steel armor', 'Broken Ancient Armor'],
        weapons: ['axe', 'goblin arm', 'knight\'s rusty blade', 'bow & arrow', 'fortified steel waraxe', 'Broken Ancient Dual Blades'],
        pets: ['goblin pet', 'bunny pet', 'knight companion', 'Golden Puppy'],
        materials: ['sock', 'skull', 'reindeer skin', 'wolf pelt', 'bear claw', 'golden deer antler', 'orc\'s eyeball', 'orc\'s hidden jewel', 'Giant\'s Jewel', 'Giant\'s Massive Club'],
        consumables: ['small potion', 'small mana potion'],
        mounts: ['horse', 'orc mount', 'Cerberus']
      };
      
      // Get items for the selected category
      const items = categoryItems[category] || [];
      
      // Filter items based on what the user is typing
      const filteredItems = items.filter(item => 
        item.toLowerCase().includes(focusedValue.toLowerCase())
      ).slice(0, 25); // Discord limits to 25 choices
      
      const choices = filteredItems.map(item => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: item
      }));
      
      await interaction.respond(choices);
    }
    
    if (commandName === 'equip') {
      const focusedValue = interaction.options.getFocused();
      const category = interaction.options.getString('category');
      
      // Get user's gear inventory
      const userGear = getUserGear(interaction.user.id);
      const userPets = getUserPets(interaction.user.id);
      
      let availableItems = [];
      
      if (category === 'pet') {
        // For pets, check user's pet inventory
        availableItems = Object.keys(userPets).filter(pet => userPets[pet] > 0);
      } else {
        // For gear, check user's gear inventory
        const categoryGear = userGear[category] || {};
        availableItems = Object.keys(categoryGear).filter(item => categoryGear[item] > 0);
      }
      
      // Filter items based on what the user is typing
      const filteredItems = availableItems.filter(item => 
        item.toLowerCase().includes(focusedValue.toLowerCase())
      ).slice(0, 25); // Discord limits to 25 choices
      
      const choices = filteredItems.map(item => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: item
      }));
      
      await interaction.respond(choices);
    }
    
    if (commandName === 'unequip') {
      const focusedValue = interaction.options.getFocused();
      const category = interaction.options.getString('category');
      
      // Get user's currently equipped items
      const userEquipped = getUserEquipped(interaction.user.id);
      const userEquippedPet = getUserEquippedPet(interaction.user.id);
      
      let equippedItems = [];
      
      if (category === 'pet') {
        // For pets, check if user has a pet equipped
        if (userEquippedPet) {
          equippedItems = [userEquippedPet];
        }
      } else {
        // For gear, check if user has something equipped in that category
        const equippedItem = userEquipped[category];
        if (equippedItem) {
          equippedItems = [equippedItem];
        }
      }
      
      // Filter items based on what the user is typing
      const filteredItems = equippedItems.filter(item => 
        item.toLowerCase().includes(focusedValue.toLowerCase())
      ).slice(0, 25); // Discord limits to 25 choices
      
      const choices = filteredItems.map(item => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: item
      }));
      
      await interaction.respond(choices);
    }
    
    if (commandName === 'use') {
      const focusedValue = interaction.options.getFocused();
      const userInventory = getUserInventory(interaction.user.id);
      
      // Define consumable items
      const consumableItems = ['small potion', 'small mana potion'];
      
      // Filter items that the user has in their inventory
      const availableItems = consumableItems.filter(item => 
        userInventory[item] && userInventory[item] > 0
      );
      
      // Filter based on what the user is typing
      const filteredItems = availableItems.filter(item => 
        item.toLowerCase().includes(focusedValue.toLowerCase())
      ).slice(0, 25); // Discord limits to 25 choices
      
      const choices = filteredItems.map(item => ({
        name: `${item.charAt(0).toUpperCase() + item.slice(1)} (${userInventory[item]}x)`,
        value: item
      }));
      
      await interaction.respond(choices);
    }
    return;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const { customId, user } = interaction;

    try {
      switch (customId) {
        case 'buy_shovel':
          const userCoins = getUserCoins(user.id);

          if (userCoins < 3) {
            await interaction.reply({ content: '❌ You need at least 3 Panda Coins to buy a shovel!', ephemeral: true });
            break;
          }

          // Check current shovel count (including old shovel format)
          const inventory = getUserInventory(user.id);
          let totalShovels = 0;
          totalShovels += inventory['shovel'] || 0;
          totalShovels += inventory['shovel_1'] || 0;
          totalShovels += inventory['shovel_2'] || 0;
          totalShovels += inventory['shovel_3'] || 0;

          if (totalShovels >= 5) {
            await interaction.reply({ content: '❌ You can only have a maximum of 5 shovels at a time!', ephemeral: true });
            break;
          }

          if (removeCoins(user.id, 3)) {
            addItemToInventory(user.id, 'shovel_3', 1);
            
            // Check if user has a previous ephemeral message and delete it
            const previousEphemeral = lastEphemeralMessages.get(user.id);
            if (previousEphemeral) {
              try {
                await previousEphemeral.delete();
              } catch (error) {
                console.log('Could not delete previous ephemeral message:', error.message);
              }
            }

            // Send new ephemeral message and store it
            const ephemeralMessage = await interaction.reply({ content: '✅ You bought a shovel with 3 uses! Use `/dig` to start digging for treasures!', ephemeral: true });
            lastEphemeralMessages.set(user.id, ephemeralMessage);
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
          break;

        case 'buy_axe':
          const userCoinsAxe = getUserCoins(user.id);

          if (userCoinsAxe < 1) {
            await interaction.reply({ content: '❌ You need at least 1 Panda Coin to buy an axe!', ephemeral: true });
            break;
          }

          if (removeCoins(user.id, 1)) {
            addGearToInventory(user.id, 'weapon', 'axe', 1);
            
            // Check if user has a previous ephemeral message and delete it
            const previousEphemeral = lastEphemeralMessages.get(user.id);
            if (previousEphemeral) {
              try {
                await previousEphemeral.delete();
              } catch (error) {
                console.log('Could not delete previous ephemeral message:', error.message);
              }
            }

            // Send new ephemeral message and store it
            const ephemeralMessage = await interaction.reply({ content: '✅ You bought an axe! Use `/equip weapon axe` to equip it!', ephemeral: true });
            lastEphemeralMessages.set(user.id, ephemeralMessage);
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
          break;

        case 'buy_bow':
          const userCoinsBow = getUserCoins(user.id);

          if (userCoinsBow < 40) {
            await interaction.reply({ content: '❌ You need at least 40 Panda Coins to buy a Bow & Arrow!', ephemeral: true });
            break;
          }

          if (removeCoins(user.id, 40)) {
            addGearToInventory(user.id, 'weapon', 'bow & arrow', 1);
            
            // Check if user has a previous ephemeral message and delete it
            const previousEphemeral = lastEphemeralMessages.get(user.id);
            if (previousEphemeral) {
              try {
                await previousEphemeral.delete();
              } catch (error) {
                console.log('Could not delete previous ephemeral message:', error.message);
              }
            }

            // Send new ephemeral message and store it
            const ephemeralMessage = await interaction.reply({ content: '✅ You bought a Bow & Arrow! Use `/equip weapon bow & arrow` to equip it!\n🎯 This weapon has a 20% chance for headshots dealing 5-7 damage!', ephemeral: true });
            lastEphemeralMessages.set(user.id, ephemeralMessage);
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
          break;

        case 'buy_spear':
          const userCoinsSpear = getUserCoins(user.id);

          if (userCoinsSpear < 6) {
            await interaction.reply({ content: '❌ You need at least 6 Panda Coins to buy a spear!', ephemeral: true });
            break;
          }

          // Check current spear count (including old spear format)
          const spearInventory = getUserInventory(user.id);
          let totalSpears = 0;
          totalSpears += spearInventory['spear'] || 0;
          totalSpears += spearInventory['spear_1'] || 0;
          totalSpears += spearInventory['spear_2'] || 0;
          totalSpears += spearInventory['spear_3'] || 0;

          if (totalSpears >= 5) {
            await interaction.reply({ content: '❌ You can only have a maximum of 5 spears at a time!', ephemeral: true });
            break;
          }

          if (removeCoins(user.id, 6)) {
            addItemToInventory(user.id, 'spear_3', 1);
            
            // Check if user has a previous ephemeral message and delete it
            const previousEphemeral = lastEphemeralMessages.get(user.id);
            if (previousEphemeral) {
              try {
                await previousEphemeral.delete();
              } catch (error) {
                console.log('Could not delete previous ephemeral message:', error.message);
              }
            }

            // Send new ephemeral message and store it
            const ephemeralMessage = await interaction.reply({ content: '✅ You bought a spear with 3 uses! Use `/hunt` to start hunting animals in the forest!', ephemeral: true });
            lastEphemeralMessages.set(user.id, ephemeralMessage);
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
          break;



        case 'fight_goblin':
          const userCoinsBattle = getUserCoins(user.id);
          const userManaBattle = getUserMana(user.id);

          if (userCoinsBattle < 10) {
            await interaction.reply({ content: '❌ You need at least 10 Panda Coins to fight The Goblin!', ephemeral: true });
            break;
          }

          if (userManaBattle < 10) {
            await interaction.reply({ content: '🔮 **Not Enough Mana!** You need at least 10 mana to fight The Goblin.\n\n*Mana regenerates at 1 per minute. Use /merchant buy to buy mana potions for faster farming.*', ephemeral: true });
            break;
          }

          // Check if player is already in battle
          if (activeBattles.has(user.id)) {
            const quitBattleEmbed = {
              color: 0xFFA500, // Orange for warning
              title: '⚔️ **Battle Already in Progress**',
              description: 'You are currently in a battle! Do you want to quit your current fight and start a new one?',
              fields: [
                {
                  name: '⚠️ Warning',
                  value: 'Quitting your current battle will forfeit any progress and you won\'t receive rewards.',
                  inline: false
                }
              ],
              footer: {
                text: 'Choose your action carefully!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            const quitButtons = [
              {
                type: 2,
                style: 4, // Red for danger
                label: '❌ QUIT CURRENT BATTLE',
                custom_id: `quit_battle_${user.id}`,
                emoji: { name: '⚔️' }
              },
              {
                type: 2,
                style: 2, // Gray for cancel
                label: '🔙 CANCEL',
                custom_id: `cancel_quit_battle_${user.id}`,
                emoji: { name: '🛡️' }
              }
            ];

            const actionRow = {
              type: 1,
              components: quitButtons
            };

            await interaction.reply({ embeds: [quitBattleEmbed], components: [actionRow] });
            break;
          }

          if (removeCoins(user.id, 10) && spendMana(user.id, 10)) {
            const battleResult = initiateBattle(user.id, 'goblin');

            if (battleResult.type === 'battle_end') {
              const battleEmbed = {
                color: battleResult.victory ? 0x00FF00 : 0xFF0000,
                title: battleResult.victory ? '🎉 **VICTORY ACHIEVED!**' : '💀 **DEFEAT**',
                description: battleResult.battleLog.join('\n'),
                thumbnail: {
                  url: battleResult.victory ? 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless' : 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                footer: {
                  text: battleResult.victory ? '🏆 Well fought, brave warrior! Return when you\'re ready for another challenge.' : '💪 Better luck next time! Train harder and come back stronger.',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              await interaction.reply({ embeds: [battleEmbed] });
            } else {
              // Show initial battle state and attack options
              const battleEmbed = {
                color: 0x8B4513, // Saddle brown for battle theme
                title: '⚔️ **Epic Battle in Progress!**',
                description: battleResult.battleState.battleLog.join('\n'),
                thumbnail: {
                  url: user.displayAvatarURL({ dynamic: true, size: 256 })
                },
                fields: [
                  {
                    name: '🎯 **Choose Your Attack Strategy**',
                    value: 'Select your next move wisely, brave warrior!',
                    inline: false,
                  },
                ],
                footer: {
                  text: '⚔️ Strategic combat - every choice matters! 🛡️',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              const attackButtons = battleResult.attackOptions.slice(0, 5).map(attack => ({
                type: 2,
                style: attack.id === 'use_potion' ? 3 : 1, // Green for potion, blue for attacks
                label: attack.name,
                custom_id: `attack_${attack.id}_${user.id}`,
                emoji: attack.id === 'use_potion' ? { name: '🧪' } : { name: '⚔️' },
              }));

              const actionRow = {
                type: 1,
                components: attackButtons,
              };

              await interaction.reply({ embeds: [battleEmbed], components: [actionRow] });
            }
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
          break;

        case 'fight_knight':
          const userCoinsKnight = getUserCoins(user.id);
          const userManaKnight = getUserMana(user.id);

          if (userCoinsKnight < 30) {
            await interaction.reply({ content: '❌ You need at least 30 Panda Coins to fight The Knight!', ephemeral: true });
            break;
          }

          if (userManaKnight < 20) {
            await interaction.reply({ content: '🔮 **Not Enough Mana!** You need at least 20 mana to fight The Knight.\n\n*Mana regenerates at 1 per minute. Use /merchant buy to buy mana potions for faster farming.*', ephemeral: true });
            break;
          }

          // Check if player is already in battle
          if (activeBattles.has(user.id)) {
            const quitBattleEmbed = {
              color: 0xFFA500, // Orange for warning
              title: '⚔️ **Battle Already in Progress**',
              description: 'You are currently in a battle! Do you want to quit your current fight and start a new one?',
              fields: [
                {
                  name: '⚠️ Warning',
                  value: 'Quitting your current battle will forfeit any progress and you won\'t receive rewards.',
                  inline: false
                }
              ],
              footer: {
                text: 'Choose your action carefully!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            const quitButtons = [
              {
                type: 2,
                style: 4, // Red for danger
                label: '❌ QUIT CURRENT BATTLE',
                custom_id: `quit_battle_${user.id}`,
                emoji: { name: '⚔️' }
              },
              {
                type: 2,
                style: 2, // Gray for cancel
                label: '🔙 CANCEL',
                custom_id: `cancel_quit_battle_${user.id}`,
                emoji: { name: '🛡️' }
              }
            ];

            const actionRow = {
              type: 1,
              components: quitButtons
            };

            await interaction.reply({ embeds: [quitBattleEmbed], components: [actionRow] });
            break;
          }

          if (removeCoins(user.id, 30) && spendMana(user.id, 20)) {
            const knightBattleResult = initiateBattle(user.id, 'knight');

            if (knightBattleResult.type === 'battle_end') {
              const knightBattleEmbed = {
                color: knightBattleResult.victory ? 0x00FF00 : 0xFF0000,
                title: knightBattleResult.victory ? '🏆 **LEGENDARY VICTORY!**' : '💀 **DEFEATED BY THE KNIGHT**',
                description: knightBattleResult.battleLog.join('\n'),
                thumbnail: {
                  url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                footer: {
                  text: knightBattleResult.victory ? '⚔️ A legendary victory! The Knight was a truly formidable opponent.' : '🛡️ The Knight proved too strong. Train harder and return for revenge!',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              // Clean up battle state
              activeBattles.delete(user.id);
              
              await interaction.reply({ embeds: [knightBattleEmbed] });
            } else {
              // Show initial battle state and attack options
              const knightBattleEmbed = {
                color: 0x2C1810, // Dark brown for knight battle
                title: '⚔️ **Epic Battle Against The Knight!**',
                description: knightBattleResult.battleState.battleLog.join('\n'),
                thumbnail: {
                  url: user.displayAvatarURL({ dynamic: true, size: 256 })
                },
                fields: [
                  {
                    name: '🎯 **Choose Your Attack Strategy**',
                    value: 'The Knight is a formidable opponent - choose your strategy carefully, brave warrior!',
                    inline: false,
                  },
                ],
                footer: {
                  text: '⚔️ Strategic combat against a legendary foe! 🛡️',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              const attackButtons = knightBattleResult.attackOptions.slice(0, 5).map(attack => ({
                type: 2,
                style: attack.id === 'use_potion' ? 3 : 1, // Green for potion, blue for attacks
                label: attack.name,
                custom_id: `attack_${attack.id}_${user.id}`,
                emoji: attack.id === 'use_potion' ? { name: '🧪' } : { name: '⚔️' },
              }));

              const actionRow = {
                type: 1,
                components: attackButtons,
              };

              await interaction.reply({ embeds: [knightBattleEmbed], components: [actionRow] });
            }
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
                  }
        break;

        case 'fight_orc':
          const userCoinsOrc = getUserCoins(user.id);
          const userManaOrc = getUserMana(user.id);

          if (userCoinsOrc < 50) {
            await interaction.reply({ content: '❌ You need at least 50 Panda Coins to fight The Orc!', ephemeral: true });
            break;
          }

          if (userManaOrc < 30) {
            await interaction.reply({ content: '🔮 **Not Enough Mana!** You need at least 30 mana to fight The Orc.\n\n*Mana regenerates at 1 per minute. Use /merchant buy to buy mana potions for faster farming.*', ephemeral: true });
            break;
          }

          // Check if player is already in battle
          if (activeBattles.has(user.id)) {
            const quitBattleEmbed = {
              color: 0xFFA500, // Orange for warning
              title: '⚔️ **Battle Already in Progress**',
              description: 'You are currently in a battle! Do you want to quit your current fight and start a new one?',
              fields: [
                {
                  name: '⚠️ Warning',
                  value: 'Quitting your current battle will forfeit any progress and you won\'t receive rewards.',
                  inline: false
                }
              ],
              footer: {
                text: 'Choose your action carefully!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            const quitButtons = [
              {
                type: 2,
                style: 4, // Red for danger
                label: '❌ QUIT CURRENT BATTLE',
                custom_id: `quit_battle_${user.id}`,
                emoji: { name: '⚔️' }
              },
              {
                type: 2,
                style: 2, // Gray for cancel
                label: '🔙 CANCEL',
                custom_id: `cancel_quit_battle_${user.id}`,
                emoji: { name: '🛡️' }
              }
            ];

            const actionRow = {
              type: 1,
              components: quitButtons
            };

            await interaction.reply({ embeds: [quitBattleEmbed], components: [actionRow] });
            break;
          }

          if (removeCoins(user.id, 50) && spendMana(user.id, 30)) {
            const orcBattleResult = initiateBattle(user.id, 'orc');

            if (orcBattleResult.type === 'battle_end') {
              const orcBattleEmbed = {
                color: orcBattleResult.victory ? 0x00FF00 : 0xFF0000,
                title: orcBattleResult.victory ? '🏆 **BRUTAL VICTORY!**' : '💀 **CRUSHED BY THE ORC**',
                description: orcBattleResult.battleLog.join('\n'),
                thumbnail: {
                  url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                footer: {
                  text: orcBattleResult.victory ? '⚔️ An incredible victory! The Orc was a truly brutal opponent.' : '🛡️ The Orc proved too powerful. Train harder and return for revenge!',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              // Clean up battle state
              activeBattles.delete(user.id);
              
              await interaction.reply({ embeds: [orcBattleEmbed] });
            } else {
              // Show initial battle state and attack options
              const orcBattleEmbed = {
                color: 0x8B0000, // Dark red for orc battle
                title: '⚔️ **Brutal Battle Against The Orc!**',
                description: orcBattleResult.battleState.battleLog.join('\n'),
                thumbnail: {
                  url: user.displayAvatarURL({ dynamic: true, size: 256 })
                },
                fields: [
                  {
                    name: '🎯 **Choose Your Attack Strategy**',
                    value: 'The Orc is a brutal opponent - choose your strategy carefully, brave warrior!',
                    inline: false,
                  },
                ],
                footer: {
                  text: '⚔️ Strategic combat against a brutal foe! 🛡️',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              const attackButtons = orcBattleResult.attackOptions.slice(0, 5).map(attack => ({
                type: 2,
                style: attack.id === 'use_potion' ? 3 : 1, // Green for potion, blue for attacks
                label: attack.name,
                custom_id: `attack_${attack.id}_${user.id}`,
                emoji: attack.id === 'use_potion' ? { name: '🧪' } : { name: '⚔️' },
              }));

              const actionRow = {
                type: 1,
                components: attackButtons,
              };

              await interaction.reply({ embeds: [orcBattleEmbed], components: [actionRow] });
            }
          } else {
            await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
          }
        break;



      case 'reload':
        console.log('🔄 Reload command triggered by user:', user.username);
        
        try {
          // Reload data from file
          const reloadSuccess = reloadPandaCoinData();
          
          if (reloadSuccess) {
            await interaction.reply({ 
              content: '✅ Data reloaded from file successfully!', 
              ephemeral: true 
            });
          } else {
            await interaction.reply({ 
              content: '❌ Failed to reload data from file.', 
              ephemeral: true 
            });
          }
        } catch (reloadError) {
          console.error('❌ Error in reload command:', reloadError);
          await interaction.reply({ 
            content: '❌ An error occurred while reloading data.', 
            ephemeral: true 
          });
        }
        break;

      case 'test':
        console.log('🧪 TEST CASE REACHED!');
        await interaction.reply('🧪 Test case working!');
        break;

        // Archive navigation buttons
        case 'archive_prev_1':
        case 'archive_prev_2':
        case 'archive_prev_3':
        case 'archive_prev_4':
        case 'archive_prev_5':
        case 'archive_prev_6':
        case 'archive_prev_7':
        case 'archive_next_1':
        case 'archive_next_2':
        case 'archive_next_3':
        case 'archive_next_4':
        case 'archive_next_5':
        case 'archive_next_6':
        case 'archive_next_7':
          const archiveMatch = customId.match(/^archive_(prev|next)_(\d+)$/);
          if (archiveMatch) {
            const direction = archiveMatch[1];
            const currentPage = parseInt(archiveMatch[2]);
            let newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
            
            // Ensure page is within bounds
            newPage = Math.max(1, Math.min(7, newPage));
            
            // Define all items in the game by category
            const archivePages = {
              1: {
                title: '🪖 **Helmets & Headgear**',
                items: [
                  'goblin mask',
                  'knight\'s rusty helmet', 
                  'old worn helmet',
                  'shiny reindeer antlers',
                  'fortified steel helmet',
                  'Broken Ancient Helmet'
                ],
                description: 'Protective headgear that grants defense and health bonuses.'
              },
              2: {
                title: '🛡️ **Body Armor**',
                items: [
                  'goblin clothing',
                  'knight\'s rusty armor',
                  'old worn armor',
                  'fortified steel armor',
                  'Broken Ancient Armor'
                ],
                description: 'Body protection that provides defense and health bonuses.'
              },
              3: {
                title: '⚔️ **Weapons & Tools**',
                items: [
                  'axe',
                  'goblin arm',
                  'knight\'s rusty blade',
                  'bow & arrow',
                  'shovel',
                  'spear',
                  'fortified steel waraxe',
                  'Broken Ancient Dual Blades'
                ],
                description: 'Weapons for combat and tools for gathering resources.'
              },
              4: {
                title: '🐾 **Pets & Companions**',
                items: [
                  'goblin pet',
                  'bunny pet',
                  'knight companion',
                  'Golden Puppy'
                ],
                description: 'Loyal companions that provide luck and other bonuses.'
              },
              5: {
                title: '📦 **Materials & Resources**',
                items: [
                  'sock',
                  'skull',
                  'reindeer skin',
                  'wolf pelt',
                  'bear claw',
                  'golden deer antler',
                  'orc\'s eyeball',
                  'orc\'s hidden jewel',
                  'Giant\'s Jewel',
                  'Giant\'s Massive Club'
                ],
                description: 'Valuable materials that can be sold to merchants.'
              },
              6: {
                title: '🧪 **Consumables & Potions**',
                items: [
                  'small potion',
                  'small mana potion'
                ],
                description: 'Items that provide temporary effects or healing.'
              },
              7: {
                title: '🐎 **Mounts & Rides**',
                items: [
                  'horse',
                  'orc mount',
                  'Cerberus'
                ],
                description: 'Transportation that provides speed bonuses.'
              }
            };
            
            // Get current page data
            const pageData = archivePages[newPage];
            const totalPages = Object.keys(archivePages).length;
            
            // Calculate completion for this page
            let discoveredCount = 0;
            const pageItems = pageData.items.map(item => {
              const isDiscovered = isItemDiscovered(user.id, item);
              if (isDiscovered) discoveredCount++;
              
              let emoji = '📦';
              const itemInfo = itemDatabase[item];
              if (itemInfo && itemInfo.emoji) {
                emoji = itemInfo.emoji;
              } else {
                const customEmote = getItemEmote(item);
                if (customEmote !== itemEmotes['default']) {
                  emoji = customEmote;
                }
              }
              
              const status = isDiscovered ? '✅' : '❌';
              const displayName = item.charAt(0).toUpperCase() + item.slice(1);
              
              return `${status} ${emoji} **${displayName}**`;
            });
            
            const completionPercentage = Math.round((discoveredCount / pageData.items.length) * 100);
            
            // Create archive embed
            const archiveEmbed = {
              color: 0x8B4513, // Saddle brown for book theme
              title: '📚 **The Grand Archive**',
              description: `*An ancient tome containing knowledge of all items in the realm...*\n\n**Page ${newPage} of ${totalPages}**`,
              thumbnail: {
                url: user.displayAvatarURL({ dynamic: true, size: 256 })
              },
              fields: [
                {
                  name: pageData.title,
                  value: pageData.description,
                  inline: false
                },
                {
                  name: '📖 **Collection Progress**',
                  value: `${discoveredCount}/${pageData.items.length} items discovered (${completionPercentage}%)`,
                  inline: false
                },
                {
                  name: '📋 **Items**',
                  value: pageItems.join('\n'),
                  inline: false
                }
              ],
              footer: {
                text: `📚 Page ${newPage}/${totalPages} | Use navigation buttons to browse`,
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            // Create navigation buttons
            const navigationRow = {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 2,
                  label: '◀️ Previous',
                  custom_id: `archive_prev_${newPage}`,
                  disabled: newPage <= 1
                },
                {
                  type: 2,
                  style: 2,
                  label: 'Next ▶️',
                  custom_id: `archive_next_${newPage}`,
                  disabled: newPage >= totalPages
                }
              ]
            };
            
            await interaction.update({ 
              embeds: [archiveEmbed], 
              components: [navigationRow] 
            });
          }
          break;

      default:
          // Handle attack buttons
          if (customId.startsWith('attack_')) {
            // Extract userId from the end of the custom_id
            const lastUnderscoreIndex = customId.lastIndexOf('_');
            const userId = customId.substring(lastUnderscoreIndex + 1);
            const attackId = customId.substring(7, lastUnderscoreIndex); // Remove 'attack_' prefix and userId suffix

            if (user.id !== userId) {
              await interaction.reply({ content: '❌ This is not your battle!', ephemeral: true });
              break;
            }

            // Get battle state to show dynamic enemy-specific processing messages
            const battleState = activeBattles.get(user.id);
            
            // Create dynamic enemy-specific processing messages
            const goblinProcessingMessages = [
              "The Goblin snarls and raises his crude weapon menacingly...",
              "The Goblin's eyes flash with malicious intent as battle intensifies...",
              "The Goblin stumbles but quickly regains his footing...",
              "The Goblin lets out a guttural growl of defiance...",
              "The Goblin wipes green blood from his scarred face...",
              "The Goblin's breathing becomes more ragged with each exchange...",
              "The Goblin brandishes his weapon with wild abandon...",
              "The Goblin's wounds are beginning to show...",
              "The Goblin's grip tightens desperately on his weapon...",
              "The Goblin's fury intensifies as the battle drags on..."
            ];

            const knightProcessingMessages = [
              "The Knight adjusts his stance with practiced precision...",
              "The Knight's armor clinks as he prepares his next move...",
              "The Knight's breathing echoes steadily from within his helmet...",
              "The Knight raises his weapon with unwavering determination...",
              "The Knight's movements remain calculated and methodical...",
              "The Knight shows the discipline of countless battles...",
              "The Knight's armor bears new dents from your attacks...",
              "The Knight shifts his weight, preparing for your next move...",
              "The Knight's eyes gleam with battle-tested resolve...",
              "The Knight grips his weapon with both hands confidently...",
              "The Knight's stance speaks of years of combat training...",
              "The Knight maintains perfect form even as fatigue sets in..."
            ];

            const orcProcessingMessages = [
              "The Orc snarls and bares his tusks menacingly...",
              "The Orc's muscles ripple as he prepares to strike...",
              "The Orc lets out a guttural war cry...",
              "The Orc's eyes burn with savage fury...",
              "The Orc grips his weapon with primal strength...",
              "The Orc's scars tell tales of brutal battles...",
              "The Orc's breathing is heavy with bloodlust...",
              "The Orc's stance is wild and unpredictable...",
              "The Orc's rage intensifies with each passing moment...",
              "The Orc's movements are fierce and untamed...",
              "The Orc's weapon thirsts for more blood...",
              "The Orc's primal instincts guide his every move..."
            ];

            // Get appropriate processing message based on enemy and turn
            let processingMessage = "Battle intensifies as you clash with your opponent...";
            if (battleState && battleState.enemy) {
              let messages;
              if (battleState.enemy.name === 'The Goblin') {
                messages = goblinProcessingMessages;
              } else if (battleState.enemy.name === 'The Orc') {
                messages = orcProcessingMessages;
              } else {
                messages = knightProcessingMessages;
              }
              const messageIndex = (Date.now() + battleState.turn) % messages.length; // Use time + turn for variety
              processingMessage = messages[messageIndex];
            }

            // Create enemy-specific processing embed with exciting emojis
            let embedColor, embedTitle, embedThumbnail, footerText, footerIcon;
            
            if (battleState.enemy.name === 'The Goblin') {
              embedColor = 0x228B22; // Forest green for goblin
              embedTitle = '🟢 **Goblin Ambush!**';
              embedThumbnail = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
              footerText = '🟢 The sneaky goblin prepares his next move...';
              footerIcon = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
            } else if (battleState.enemy.name === 'The Orc') {
              embedColor = 0x8B0000; // Dark red for orc
              embedTitle = '🔴 **Orc Rage!**';
              embedThumbnail = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
              footerText = '🔴 The savage orc thirsts for blood...';
              footerIcon = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
            } else {
              embedColor = 0x4169E1; // Royal blue for knight
              embedTitle = '🔵 **Knight\'s Honor!**';
              embedThumbnail = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
              footerText = '🔵 The noble knight maintains his stance...';
              footerIcon = 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless';
            }

            await interaction.update({ 
              embeds: [{
                color: embedColor,
                title: embedTitle,
                description: `**${processingMessage}**\n\n*The tension builds as you prepare your next move, brave warrior...*`,
                thumbnail: {
                  url: embedThumbnail
                },
                footer: { 
                  text: footerText,
                  icon_url: footerIcon
                },
                timestamp: new Date().toISOString()
              }],
              components: []
            });

            // MANDATORY 3-second delay for all attacks
            await new Promise(resolve => setTimeout(resolve, 3000));

            const attackResult = processPlayerAttack(user.id, attackId);

            if (attackResult.error) {
              await interaction.editReply({ 
                embeds: [{
                  color: 0xFF0000,
                  title: '❌ Battle Error',
                  description: `❌ ${attackResult.error}`,
                  footer: { text: 'Please try again.' }
                }],
                components: []
              });
              break;
            }

            if (attackResult.type === 'battle_end') {
              const battleEmbed = {
                color: attackResult.victory ? 0x00FF00 : 0xFF0000,
                title: attackResult.victory ? '🏆 **EPIC VICTORY!**' : '💀 **DEFEAT**',
                description: attackResult.battleLog.join('\n'),
                thumbnail: {
                  url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                footer: {
                  text: attackResult.victory ? '🏆 Well fought, brave warrior! Return when you\'re ready for another challenge.' : '💪 Better luck next time! Train harder and come back stronger.',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              // Mana system - no cooldown needed, mana regenerates naturally
              const battleState = activeBattles.get(user.id);
              if (battleState && battleState.enemyType) {
                console.log(`🔮 Mana system active - no cooldown for user ${user.id} on enemy ${battleState.enemyType}`);
              }
              
              // Clean up battle state
              activeBattles.delete(user.id);
              
              await interaction.editReply({ embeds: [battleEmbed], components: [] });

              // Check for role assignments if coins were gained
              if (attackResult.victory && interaction.guild) {
                await checkAndAssignRoles(user.id, interaction.guild.id, interaction.guild);
              }
            } else {
              // Continue battle - show updated state and attack options
              console.log(`📝 Battle log for embed:`, attackResult.battleLog);
              console.log(`📝 Battle state:`, attackResult.battleState);
              
              // Simple approach: show the full battle log
              const displayLog = attackResult.battleLog || [];
              console.log(`📝 Display log for embed:`, displayLog);
              
              // Determine embed color based on whether this was a potion use
              const isPotionUse = displayLog.some(msg => msg.includes('🧪'));
              const embedColor = isPotionUse ? 0x00FF88 : 0x8B4513; // Green for potion, brown for normal
              
              // Get enemy emoji based on enemy type - add error handling
              let enemyEmoji = '⚔️'; // Default
              if (attackResult.battleState && attackResult.battleState.enemy) {
                enemyEmoji = attackResult.battleState.enemy.name === 'The Goblin' ? '👹' : '⚔️';
              }
              
              const battleEmbed = {
                color: embedColor,
                title: '⚔️ **Battle Continues!**',
                description: displayLog.join('\n'),
                thumbnail: {
                  url: user.displayAvatarURL({ dynamic: true, size: 256 })
                },
                fields: [
                  {
                    name: '🎯 **Choose Your Next Attack**',
                    value: `${enemyEmoji} **Enemy Health:** ${attackResult.battleState?.enemyHealth || 0}/${attackResult.battleState?.enemyMaxHealth || 0}\n🏆 **Your Health:** ${attackResult.battleState?.playerHealth || 0}/${attackResult.battleState?.playerMaxHealth || 0}`,
                    inline: false,
                  },
                ],
                footer: {
                  text: '⚔️ Think strategically about your next move, brave warrior! 🛡️',
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
                timestamp: new Date().toISOString()
              };

              const attackButtons = (attackResult.attackOptions || []).slice(0, 5).map(attack => ({
                type: 2,
                style: attack.id === 'use_potion' ? 3 : 1,
                label: attack.name,
                custom_id: `attack_${attack.id}_${user.id}`,
                emoji: attack.id === 'use_potion' ? { name: '🧪' } : { name: '⚔️' },
              }));

              const actionRow = {
                type: 1,
                components: attackButtons,
              };

              await interaction.editReply({ embeds: [battleEmbed], components: [actionRow] });
            }
            break;
          }
          
          // Handle quest reward claiming
          if (customId === 'claim_quest_dig10') {
            const digUserQuestData = getUserQuestData(user.id);
            
            if (!digUserQuestData.completedQuests.dig10) {
              await interaction.reply({ content: '❌ Quest not completed yet! Dig 10 times first.', ephemeral: true });
              break;
            }

            if (digUserQuestData.completedQuests.dig10.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const digReward = digUserQuestData.completedQuests.dig10.reward;
            addCoins(user.id, digReward, interaction.guild);
            digUserQuestData.completedQuests.dig10.claimed = true;
            saveQuestData();

            const digClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on completing your quest!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Dig Apprentice**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${digReward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Next Quest',
                  value: '**Dungeon Preparation** - Achieve 10 total power to prepare for battle!',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Next quest coming soon, for now you\'ve done well!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [digClaimEmbed] });
            break;
          }

          if (customId === 'claim_quest_power10') {
            const powerUserQuestData = getUserQuestData(user.id);
            
            if (!powerUserQuestData.completedQuests.power10) {
              await interaction.reply({ content: '❌ Quest not completed yet! Achieve 10 total power first.', ephemeral: true });
              break;
            }

            if (powerUserQuestData.completedQuests.power10.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const powerReward = powerUserQuestData.completedQuests.power10.reward;
            addCoins(user.id, powerReward, interaction.guild);
            powerUserQuestData.completedQuests.power10.claimed = true;
            saveQuestData();

            const powerClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on completing your quest!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Dungeon Preparation**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${powerReward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Next Quest',
                  value: '**Goblin Slayer** - Defeat the goblin enemy in the dungeon!',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Next quest coming soon, for now you\'ve done well!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [powerClaimEmbed] });
            break;
          }

          if (customId === 'claim_quest_power25') {
            const power25UserQuestData = getUserQuestData(user.id);
            
            if (!power25UserQuestData.completedQuests.power25) {
              await interaction.reply({ content: '❌ Quest not completed yet! Achieve 25 total power first.', ephemeral: true });
              break;
            }

            if (power25UserQuestData.completedQuests.power25.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const power25Reward = power25UserQuestData.completedQuests.power25.reward;
            addCoins(user.id, power25Reward, interaction.guild);
            power25UserQuestData.completedQuests.power25.claimed = true;
            saveQuestData();

            const power25ClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on becoming a legendary warrior!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Legendary Warrior**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${power25Reward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Achievement',
                  value: '**Legendary Status Achieved!** You\'ve reached the pinnacle of power! 🏆',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 You are now a legendary warrior! More quests coming soon!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [power25ClaimEmbed] });
            break;
          }

          if (customId === 'claim_quest_orcDefeat') {
            const orcUserQuestData = getUserQuestData(user.id);
            
            if (!orcUserQuestData.completedQuests.orcDefeat) {
              await interaction.reply({ content: '❌ Quest not completed yet! Defeat The Orc Enemy first.', ephemeral: true });
              break;
            }

            if (orcUserQuestData.completedQuests.orcDefeat.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const orcReward = orcUserQuestData.completedQuests.orcDefeat.reward;
            addCoins(user.id, orcReward, interaction.guild);
            orcUserQuestData.completedQuests.orcDefeat.claimed = true;
            saveQuestData();

            const orcClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on becoming the ultimate warrior!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Orc Slayer**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${orcReward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Achievement',
                  value: '**Ultimate Warrior Status Achieved!** You\'ve defeated the mightiest enemy! 🏆',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 You are now the ultimate warrior! More quests coming soon!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [orcClaimEmbed] });
            break;
          }



          if (customId === 'claim_quest_goblinDefeat') {
            const goblinUserQuestData = getUserQuestData(user.id);
            
            if (!goblinUserQuestData.completedQuests.goblinDefeat) {
              await interaction.reply({ content: '❌ Quest not completed yet! Defeat the goblin first.', ephemeral: true });
              break;
            }

            if (goblinUserQuestData.completedQuests.goblinDefeat.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const goblinReward = goblinUserQuestData.completedQuests.goblinDefeat.reward;
            addCoins(user.id, goblinReward, interaction.guild);
            goblinUserQuestData.completedQuests.goblinDefeat.claimed = true;
            saveQuestData();

            const goblinClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on completing your quest!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Goblin Slayer**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${goblinReward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Quest Chain',
                  value: '**Complete!** You\'ve finished all available quests! 🎉',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 You\'re a true warrior! More quests coming soon!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [goblinClaimEmbed] });
            break;
          }

          if (customId === 'claim_quest_hunt20') {
            const huntUserQuestData = getUserQuestData(user.id);
            
            if (!huntUserQuestData.completedQuests.hunt20) {
              await interaction.reply({ content: '❌ Quest not completed yet! Hunt 20 times first.', ephemeral: true });
              break;
            }

            if (huntUserQuestData.completedQuests.hunt20.claimed) {
              await interaction.reply({ content: '❌ You have already claimed this quest reward!', ephemeral: true });
              break;
            }

            const huntReward = huntUserQuestData.completedQuests.hunt20.reward;
            addCoins(user.id, huntReward, interaction.guild);
            huntUserQuestData.completedQuests.hunt20.claimed = true;
            saveQuestData();

            const huntClaimEmbed = {
              color: 0x00FF00,
              title: '🎁 **Quest Reward Claimed!**',
              description: 'Congratulations on completing your quest!',
              fields: [
                {
                  name: '🎯 Quest Completed',
                  value: '**Master Hunter**',
                  inline: true
                },
                {
                  name: '💰 Reward Received',
                  value: `+${huntReward} Panda Coins 🐼`,
                  inline: true
                },
                {
                  name: '🎯 New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false
                },
                {
                  name: '🎯 Quest Chain',
                  value: '**Complete!** You\'ve finished all available quests! 🎉',
                  inline: false
                }
              ],
              footer: {
                text: '🎯 You\'re a true warrior and master hunter! More quests coming soon!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [huntClaimEmbed] });
            break;
          }
          
          // Handle merchant buying buttons
          if (customId.startsWith('buy_small_potion_')) {
            const parts = customId.split('_');
            const userId = parts[parts.length - 1]; // Get the last part as userId

            if (user.id !== userId) {
              await interaction.reply({ content: '❌ You can only buy items for yourself!', ephemeral: true });
              break;
            }

            const userCoins = getUserCoins(user.id);
            if (userCoins < 4) {
              await interaction.reply({ content: '❌ You need at least 4 Panda Coins to buy a Small Potion!', ephemeral: true });
              break;
            }

            if (removeCoins(user.id, 4)) {
              addItemToInventory(user.id, 'small potion', 1);

              const buyEmbed = {
                color: 0x00FF00,
                title: '🧪 Potion Purchased!',
                description: '**"A wise investment! This will serve you well in battle."**',
                fields: [
                  {
                    name: '📦 Item Received',
                    value: '🧪 Small Potion x1',
                    inline: false,
                  },
                  {
                    name: '💰 Coins Spent',
                    value: '-4 Panda Coins 🐼',
                    inline: false,
                  },
                  {
                    name: '🎯 Your New Balance',
                    value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                    inline: false,
                  },
                ],
                footer: {
                  text: 'Use during battle to restore 3 health!',
                },
              };

              // Check if user has a previous purchase message and delete it
              const previousMessage = lastPurchaseMessages.get(user.id);
              if (previousMessage) {
                try {
                  await previousMessage.delete();
                } catch (error) {
                  console.log('Could not delete previous purchase message:', error.message);
                }
              }

              // Send new purchase message and store it
              const purchaseMessage = await interaction.reply({ embeds: [buyEmbed] });
              lastPurchaseMessages.set(user.id, purchaseMessage);

              // Check for role assignments
              if (interaction.guild) {
                await checkAndAssignRoles(user.id, interaction.guild.id, interaction.guild);
              }
            } else {
              await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
            }
            break;
          }
          // Handle mana potion buying
          if (customId.startsWith('buy_small_mana_potion_')) {
            console.log('🔮 Mana potion button clicked! Custom ID:', customId);
            const parts = customId.split('_');
            const userId = parts[parts.length - 1]; // Get the last part as userId

            if (user.id !== userId) {
              await interaction.reply({ content: '❌ You can only buy items for yourself!', ephemeral: true });
              break;
            }

            const userCoins = getUserCoins(user.id);
            if (userCoins < 8) {
              await interaction.reply({ content: '❌ You need at least 8 Panda Coins to buy a Small Mana Potion!', ephemeral: true });
              break;
            }

            if (removeCoins(user.id, 8)) {
              addItemToInventory(user.id, 'small mana potion', 1);
              console.log('🔮 Mana potion added to inventory for user:', user.id);

              const buyEmbed = {
                color: 0x00FF00,
                title: '🔮 Mana Potion Purchased!',
                description: '**"A magical essence! This will restore your mana for more dungeon battles."**',
                fields: [
                  {
                    name: '📦 Item Received',
                    value: '🔮 Small Mana Potion x1',
                    inline: false,
                  },
                  {
                    name: '💰 Coins Spent',
                    value: '-8 Panda Coins 🐼',
                    inline: false,
                  },
                  {
                    name: '🎯 Your New Balance',
                    value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                    inline: false,
                  },
                ],
                footer: {
                  text: 'Use /use small mana potion to restore 20 mana!',
                },
              };

              // Check if user has a previous purchase message and delete it
              const previousMessage = lastPurchaseMessages.get(user.id);
              if (previousMessage) {
                try {
                  await previousMessage.delete();
                } catch (error) {
                  console.log('Could not delete previous purchase message:', error.message);
                }
              }

              // Send new purchase message and store it
              const purchaseMessage = await interaction.reply({ embeds: [buyEmbed] });
              lastPurchaseMessages.set(user.id, purchaseMessage);

              // Check for role assignments
              if (interaction.guild) {
                await checkAndAssignRoles(user.id, interaction.guild.id, interaction.guild);
              }
            } else {
              await interaction.reply({ content: '❌ Transaction failed. Please try again.', ephemeral: true });
            }
            break;
          }
          // Handle merchant selling buttons
          if (customId.startsWith('sell_all_')) {
            const [, , userId, totalValue] = customId.split('_');

            if (user.id !== userId) {
              await interaction.reply({ content: '❌ You can only sell your own items!', ephemeral: true });
              break;
            }

            const userInventory = getUserInventory(user.id);
            const sellableItems = Object.entries(userInventory).filter(([item]) => merchantPrices[item]);

            if (sellableItems.length === 0) {
              await interaction.reply({ content: '❌ You have no items to sell!', ephemeral: true });
              break;
            }

            // Remove all sellable items and add coins
            let actualValue = 0;
            const soldItems = [];

            sellableItems.forEach(([item, quantity]) => {
              const price = merchantPrices[item];
              const itemValue = price * quantity;
              actualValue += itemValue;

              if (removeItemFromInventory(user.id, item, quantity)) {
                soldItems.push(`${item} x${quantity}`);
              }
            });

            addCoins(user.id, actualValue, interaction.guild);

            const soldEmbed = {
              color: 0x00FF00,
              title: '💰 Transaction Complete!',
              description: '**"Pleasure doing business with you!"**',
              fields: [
                {
                  name: '📦 Items Sold',
                  value: soldItems.join('\n'),
                  inline: false,
                },
                {
                  name: '💰 Coins Received',
                  value: `+${actualValue} Panda Coins 🐼`,
                  inline: false,
                },
                {
                  name: '🎯 Your New Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false,
                },
              ],
              footer: {
                text: 'Visit The Merchant again when you have more items to sell!',
              },
            };

            // Check if user has a previous purchase message and delete it
            const previousMessage = lastPurchaseMessages.get(user.id);
            if (previousMessage) {
              try {
                await previousMessage.delete();
              } catch (error) {
                console.log('Could not delete previous purchase message:', error.message);
              }
            }

            // Send new purchase message and store it
            const purchaseMessage = await interaction.reply({ embeds: [soldEmbed] });
            lastPurchaseMessages.set(user.id, purchaseMessage);

            // Check for role assignments
            if (interaction.guild) {
              await checkAndAssignRoles(user.id, interaction.guild.id, interaction.guild);
            }
            break;
          }


          
          // Handle quit battle functionality
          if (customId.startsWith('quit_battle_')) {
            const userId = customId.split('_')[2];
            
            if (userId !== user.id) {
              await interaction.reply({ content: '❌ This battle control is not for you!', ephemeral: true });
              break;
            }

            // Remove player from active battles
            activeBattles.delete(user.id);
            
            const quitSuccessEmbed = {
              color: 0x00FF00, // Green for success
              title: '⚔️ **Battle Quit Successfully**',
              description: 'You have quit your current battle. You can now start a new fight!',
              fields: [
                {
                  name: '🔄 Status',
                  value: 'Battle state cleared - ready for new battle',
                  inline: false
                }
              ],
              footer: {
                text: 'Choose your next opponent wisely!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.update({ embeds: [quitSuccessEmbed], components: [] });
            break;
          }

          if (customId.startsWith('cancel_quit_battle_')) {
            const cancelUserId = customId.split('_')[3];
            
            if (cancelUserId !== user.id) {
              await interaction.reply({ content: '❌ This battle control is not for you!', ephemeral: true });
              break;
            }

            const cancelEmbed = {
              color: 0x808080, // Gray for cancel
              title: '🛡️ **Battle Quit Cancelled**',
              description: 'You chose to keep your current battle. Continue fighting!',
              fields: [
                {
                  name: '⚔️ Status',
                  value: 'Current battle maintained - no changes made',
                  inline: false
                }
              ],
              footer: {
                text: 'Continue your current fight!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            await interaction.update({ embeds: [cancelEmbed], components: [] });
            break;
          }

          // Multiplayer dungeon button handlers
          if (customId === 'multi_fight_crazy_giant') {
            console.log('🎮 Multiplayer fight button clicked by:', user.username);
            console.log('🔍 DEBUG: About to call createMultiplayerBattle with user.id:', user.id);
            console.log('🔍 DEBUG: user.id type:', typeof user.id);
            console.log('🔍 DEBUG: user.id value:', user.id);
            
            // TEMPORARY: Give user stamina for testing
            addStamina(user.id, 50);
            console.log('🔍 DEBUG: Added 50 stamina for testing');
            
            let result;
            try {
              result = createMultiplayerBattle(user.id, 'crazy_giant');
              console.log('🔍 DEBUG: createMultiplayerBattle returned:', result);
            } catch (error) {
              console.log('🔍 DEBUG: Error in createMultiplayerBattle:', error);
              console.log('🔍 DEBUG: Error stack:', error.stack);
              await interaction.reply({ content: `❌ There was an error processing your request!`, ephemeral: true });
              break;
            }
          
          if (!result.success) {
            await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
            break;
          }

          // Store the channel ID for this battle
          multiplayerBattles[result.battleId].channelId = interaction.channelId;

          const boss = multiplayerBosses['crazy_giant'];
            const createEmbed = {
              color: 0x8B4513,
              title: '🎮 **Multiplayer Battle Created!**',
              description: `**${user.username}** has started a battle against **${boss.name}**!`,
              fields: [
                {
                  name: '👹 Boss',
                  value: `${boss.name}`,
                  inline: true
                },
                {
                  name: '💰 Entry Cost',
                  value: '75 Panda Coins (PAID)',
                  inline: true
                },
                {
                  name: '⏰ Join Window',
                  value: '30 seconds',
                  inline: true
                },
                {
                  name: '👥 Players',
                  value: `1/4`,
                  inline: true
                },
                {
                  name: '🎯 Battle ID',
                  value: `\`${result.battleId}\``,
                  inline: false
                },
                {
                  name: '📋 How to Join',
                  value: `Click the **JOIN BATTLE** button below to join this battle!`,
                  inline: false
                }
              ],
              footer: {
                text: 'Battle will auto-start when 4 players join or 30 seconds expire (min 2 players)! (30s left)',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            const joinRow = {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3, // Success style (green)
                  label: '⚔️ JOIN BATTLE',
                  custom_id: `multi_join_${result.battleId}`,
                  emoji: { name: '⚔️' },
                },
              ],
            };

            await interaction.reply({ embeds: [createEmbed], components: [joinRow] });
            
            // Get the message ID from the channel for live updates
            try {
              const channel = client.channels.cache.get(interaction.channelId);
              if (channel) {
                const messages = await channel.messages.fetch({ limit: 1 });
                const message = messages.first();
                if (message) {
                  multiplayerBattles[result.battleId].messageId = message.id;
                  console.log(`✅ Stored message ID ${message.id} for battle ${result.battleId}`);
                }
              }
            } catch (error) {
              console.log(`❌ Could not store message ID for battle ${result.battleId}:`, error.message);
            }
            
            console.log('✅ Multiplayer battle created successfully');
            break;
          }

          if (customId.startsWith('multi_join_')) {
            const battleId = customId.replace('multi_join_', '');
            console.log('🎮 Multiplayer join button clicked by:', user.username, 'for battle:', battleId);
            
            const result = joinMultiplayerBattle(user.id, battleId);
            
            if (!result.success) {
              await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
              break;
            }

            const battle = result.battle;
            const boss = multiplayerBosses[battle.boss];
            const timeRemaining = getBattleTimeRemaining(battleId);
            const formattedTime = formatBattleCountdown(timeRemaining);
            
            // Check if battle should be refunded or started
            const refundResult = await checkAndRefundBattle(battleId);
            if (refundResult) {
              if (refundResult.battleStarted) {
                // Battle started! Show battle embed
                const battleEmbed = createBattleEmbed(battleId);
                if (battleEmbed) {
                  // Add attack buttons if it's the player's turn
                  let attackRow = null;
                  if (battle.status === 'active' && battle.currentTurn === 'players') {
                    const currentPlayerId = battle.turnOrder[battle.currentPlayerIndex];
                    if (currentPlayerId === user.id) {
                      attackRow = {
                        type: 1,
                        components: [
                          {
                            type: 2,
                            style: 1, // Primary style (blue)
                            label: '⚔️ Basic Attack',
                            custom_id: `multi_attack_${battleId}_basic`,
                            emoji: { name: '⚔️' },
                          },
                          {
                            type: 2,
                            style: 2, // Secondary style (gray)
                            label: '🛡️ Defend',
                            custom_id: `multi_attack_${battleId}_defend`,
                            emoji: { name: '🛡️' },
                          },
                        ],
                      };
                    }
                  }
                  
                  const components = attackRow ? [attackRow] : [];
                  await interaction.reply({ embeds: [battleEmbed], components: components });
                  console.log('✅ Battle started and embed shown successfully');
                  break;
                }
              } else {
                // Battle expired/refunded
                const refundEmbed = {
                  color: 0xFF0000,
                  title: '⏰ **Battle Expired**',
                  description: refundResult.message,
                  fields: [
                    {
                      name: '💰 Refund',
                      value: '100 Panda Coins returned to host',
                      inline: false
                    }
                  ],
                  footer: {
                    text: 'Not enough players joined in time',
                    icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                  },
                  timestamp: new Date().toISOString()
                };
                
                await interaction.reply({ embeds: [refundEmbed] });
                console.log('✅ Battle refunded successfully');
                break;
              }
            }
            
            const joinEmbed = {
              color: 0x00FF00,
              title: '🎮 **Player Joined Multiplayer Battle!**',
              description: `**${user.username}** has joined the battle against **${boss.name}**!`,
              fields: [
                {
                  name: '👹 Boss',
                  value: `${boss.name}`,
                  inline: true
                },
                {
                  name: '👥 Players',
                  value: `${battle.players.length}/4`,
                  inline: true
                },
                {
                  name: '⏰ Time Remaining',
                  value: `${formattedTime}`,
                  inline: true
                },
                {
                  name: '🎯 Battle ID',
                  value: `\`${battleId}\``,
                  inline: false
                }
              ],
                              footer: {
                  text: battle.players.length >= 4 ? 'Battle will start immediately!' : `Waiting for more players... (${formattedTime} left, min 2 players)`,
                  icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                },
              timestamp: new Date().toISOString()
            };

            // Add join button for other players if battle is still waiting
            let joinRow = null;
            if (battle.status === 'waiting' && battle.players.length < 4) {
              joinRow = {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 3, // Success style (green)
                    label: '⚔️ JOIN BATTLE',
                    custom_id: `multi_join_${battleId}`,
                    emoji: { name: '⚔️' },
                  },
                ],
              };
            }

            const components = joinRow ? [joinRow] : [];
            const reply = await interaction.reply({ embeds: [joinEmbed], components: components });
            
            // Store the join embed message ID for live updates
            try {
              const channel = client.channels.cache.get(interaction.channelId);
              if (channel) {
                const messages = await channel.messages.fetch({ limit: 1 });
                const message = messages.first();
                if (message) {
                  battle.joinMessageId = message.id;
                  console.log(`✅ Stored join message ID ${message.id} for battle ${battleId}`);
                }
              }
            } catch (error) {
              console.log(`❌ Could not store join message ID for battle ${battleId}:`, error.message);
            }
            
            // Also update the original battle embed with new player count and time
            if (battle.messageId && battle.channelId) {
              try {
                const channel = client.channels.cache.get(battle.channelId);
                if (channel) {
                  const message = await channel.messages.fetch(battle.messageId);
                  if (message) {
                    // Create updated embed with live countdown
                    const updatedEmbed = {
                      color: 0x8B4513,
                      title: '🎮 **Multiplayer Battle Created!**',
                      description: `**${battle.hostUsername || 'Unknown'}** has started a battle against **${boss.name}**!`,
                      fields: [
                        {
                          name: '👹 Boss',
                          value: `${boss.name}`,
                          inline: true
                        },
                        {
                          name: '💰 Entry Cost',
                          value: '75 Panda Coins (PAID)',
                          inline: true
                        },
                        {
                          name: '⏰ Join Window',
                          value: `${formattedTime} remaining`,
                          inline: true
                        },
                        {
                          name: '👥 Players',
                          value: `${battle.players.length}/4`,
                          inline: true
                        },
                        {
                          name: '🎯 Battle ID',
                          value: `\`${battleId}\``,
                          inline: false
                        },
                        {
                          name: '📋 How to Join',
                          value: `Click the **JOIN BATTLE** button below to join this battle!`,
                          inline: false
                        }
                      ],
                      footer: {
                        text: `Battle will auto-start when 4 players join or ${formattedTime} expire (min 2 players)!`,
                        icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
                      },
                      timestamp: new Date().toISOString()
                    };
                    
                    const updatedJoinRow = {
                      type: 1,
                      components: [
                        {
                          type: 2,
                          style: 3, // Success style (green)
                          label: '⚔️ JOIN BATTLE',
                          custom_id: `multi_join_${battleId}`,
                          emoji: { name: '⚔️' },
                        },
                      ],
                    };
                    
                    await message.edit({ embeds: [updatedEmbed], components: [updatedJoinRow] });
                    console.log(`⏰ Updated original battle embed for ${battleId}: ${formattedTime} remaining, ${battle.players.length} players`);
                  }
                }
              } catch (error) {
                console.log(`❌ Could not edit original message for battle ${battleId}:`, error.message);
              }
            }
            
            console.log('✅ Player joined multiplayer battle successfully');
            break;
          }

          if (customId.startsWith('multi_attack_')) {
            console.log('🔍 Raw button customId:', customId);
            
            // Fix: Handle the case where battleId might contain underscores
            const match = customId.match(/^multi_attack_(.+)_(basic|defend)$/);
            if (!match) {
              console.log('❌ Invalid attack button format:', customId);
              await interaction.reply({ content: '❌ Invalid button format', ephemeral: true });
              break;
            }
            const battleId = match[1];
            const attackType = match[2];
            
            console.log('🔍 Parsed battleId:', battleId);
            console.log('🔍 Parsed attackType:', attackType);
            
            console.log('🎮 Multiplayer attack button clicked by:', user.username, 'for battle:', battleId, 'attack:', attackType);
            
            // Debug battle state
            const debugBattle = multiplayerBattles[battleId];
            if (debugBattle) {
              console.log('🔍 Battle state debug:');
              console.log('  - Status:', debugBattle.status);
              console.log('  - Current turn:', debugBattle.currentTurn);
              console.log('  - Current player index:', debugBattle.currentPlayerIndex);
              console.log('  - Turn order:', debugBattle.turnOrder);
              console.log('  - Players:', debugBattle.players.map(p => `${p.userId}: ${p.health}/${p.maxHealth} HP`));
            } else {
              console.log('❌ Battle not found in multiplayerBattles');
            }
            
            const result = processMultiplayerAttack(user.id, battleId, attackType);
            
            if (!result.success) {
              console.log('❌ Attack failed:', result.error);
              await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
              break;
            }

            const battle = result.battle;
            const boss = multiplayerBosses[battle.boss];
            
            // Create battle status embed
            const battleEmbed = {
              color: battle.status === 'completed' ? 0x00FF00 : 0x8B4513,
              title: `🎮 **Multiplayer Battle - ${boss.name}**`,
              description: battle.battleLog.slice(-5).join('\n'), // Show last 5 log entries
              fields: [
                {
                  name: '👹 Boss Health',
                  value: `${battle.bossHealth}/${battle.maxBossHealth}`,
                  inline: false
                },
                {
                  name: '👥 Players',
                  value: battle.players.map(player => {
                    const status = player.health > 0 ? '🛡️' : '💀';
                    // Try to get username from client cache, fallback to ID
                    let username = player.userId;
                    try {
                      const user = client.users.cache.get(player.userId);
                      if (user) {
                        username = user.username;
                      }
                    } catch (error) {
                      console.log(`Could not get username for ${player.userId} in attack embed`);
                    }
                    return `${status} **${username}**: ${player.health}/${player.maxHealth} HP`;
                  }).join('\n'),
                  inline: false
                }
              ],
              footer: {
                text: battle.status === 'completed' ? 'Battle ended!' : `Round ${battle.round} - ${battle.currentTurn === 'boss' ? 'Boss turn' : 'Player turn'}`,
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };

            // Add attack buttons if battle is still active and it's the player's turn
            let attackRow = null;
            if (battle.status === 'active' && battle.currentTurn === 'players') {
              const currentPlayerId = battle.turnOrder[battle.currentPlayerIndex];
              const currentPlayer = battle.players.find(p => p.userId === currentPlayerId);
              
              // Only show buttons if it's the player's turn AND they're alive
              if (currentPlayerId === user.id && currentPlayer && currentPlayer.health > 0) {
                attackRow = {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 1, // Primary style (blue)
                      label: '⚔️ Basic Attack',
                      custom_id: `multi_attack_${battleId}_basic`,
                      emoji: { name: '⚔️' },
                    },
                    {
                      type: 2,
                      style: 2, // Secondary style (gray)
                      label: '🛡️ Defend',
                      custom_id: `multi_attack_${battleId}_defend`,
                      emoji: { name: '🛡️' },
                    },
                  ],
                };
              }
            }

            const components = attackRow ? [attackRow] : [];
            await interaction.reply({ embeds: [battleEmbed], components: components });
            console.log('✅ Multiplayer attack processed successfully');
            break;
          }

          // Default case for unknown buttons
          await interaction.reply({ content: 'Unknown button interaction!', ephemeral: true });
          break;
      }
    } catch (error) {
      console.error('Error handling button interaction:', error);
      const errorMessage = 'There was an error processing your request!';

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (responseError) {
        console.error('Failed to send error response:', responseError);
      }
    }
    return;
  }

  if (!interaction.isCommand()) return;

  const { commandName, user, member, guild } = interaction;

  console.log('Switch statement reached for command:', commandName);
  console.log('Command name type:', typeof commandName);
  console.log('Command name length:', commandName.length);
  console.log('Command name bytes:', Buffer.from(commandName).toString('hex'));

  try {
    switch (commandName) {
      case 'ping':
        await interaction.reply('Pong!');
        break;


      case 'pocket':
        console.log(`🔍 /pocket command called by user: ${user.id}`);
        
        const userId = user.id;

        // Initialize user data if it doesn't exist
        if (!pandaCoinData[userId]) {
          console.log(`  - Initializing new user data for ${userId}`);
          pandaCoinData[userId] = { coins: 0, lastDaily: 0, inventory: {}, archive: {} };
        }

        const currentTime = Date.now();
        const lastDaily = pandaCoinData[userId].lastDaily || 0;
        const fiveHours = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

        console.log(`  - Current time: ${currentTime}`);
        console.log(`  - Last claim: ${lastDaily}`);
        console.log(`  - Time difference: ${currentTime - lastDaily}ms`);
        console.log(`  - Cooldown: ${fiveHours}ms`);

        if (currentTime - lastDaily >= fiveHours) {
          console.log(`  - Can claim reward`);
          // Can claim reward
          addCoins(userId, 3, guild);
          pandaCoinData[userId].lastDaily = currentTime;
          savePandaCoinData();
          
          const totalCoins = getUserCoins(userId);
          const assignedRole = await checkAndAssignRoles(userId, guild.id, guild);
          let response = `🐼 You claimed your reward! +3 Panda Coins\n💰 You now have ${totalCoins} Panda Coins!`;

          if (assignedRole) {
            response += `\n🎉 Congratulations! You've earned the **${assignedRole.name}** role!`;
          }

          console.log(`  - Sending response: ${response}`);
          await interaction.reply(response);
        } else {
          console.log(`  - Cannot claim yet`);
          // Cannot claim yet
          const nextClaim = lastDaily + fiveHours;
          const timeLeft = nextClaim - currentTime;
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

          const cooldownResponse = `🐼 You've already claimed your reward!\n⏰ Come back in ${hoursLeft}h ${minutesLeft}m for your next reward.`;
          console.log(`  - Sending cooldown response: ${cooldownResponse}`);
          await interaction.reply(cooldownResponse);
        }
        break;

      case 'wallet':
      case 'balance':
        const userCoins = getUserCoins(user.id);
        await interaction.reply(`🐼 You have ${userCoins} Panda Coins!`);
        break;

      case 'archive':
        // Define all items in the game by category
        const archivePages = {
          1: {
            title: '🪖 **Helmets & Headgear**',
            items: [
              'goblin mask',
              'knight\'s rusty helmet', 
              'old worn helmet',
              'shiny reindeer antlers',
              'fortified steel helmet',
              'Broken Ancient Helmet'
            ],
            description: 'Protective headgear that grants defense and health bonuses.'
          },
          2: {
            title: '🛡️ **Body Armor**',
            items: [
              'goblin clothing',
              'knight\'s rusty armor',
              'old worn armor',
              'fortified steel armor',
              'Broken Ancient Armor'
            ],
            description: 'Body protection that provides defense and health bonuses.'
          },
          3: {
            title: '⚔️ **Weapons & Tools**',
            items: [
              'axe',
              'goblin arm',
              'knight\'s rusty blade',
              'bow & arrow',
              'shovel',
              'spear',
              'fortified steel waraxe',
              'Broken Ancient Dual Blades'
            ],
            description: 'Weapons for combat and tools for gathering resources.'
          },
          4: {
            title: '🐾 **Pets & Companions**',
            items: [
              'goblin pet',
              'bunny pet',
              'knight companion',
              'Golden Puppy'
            ],
            description: 'Loyal companions that provide luck and other bonuses.'
          },
          5: {
            title: '📦 **Materials & Resources**',
            items: [
              'sock',
              'skull',
              'reindeer skin',
              'wolf pelt',
              'bear claw',
              'golden deer antler',
              'orc\'s eyeball',
              'orc\'s hidden jewel',
              'Giant\'s Jewel',
              'Giant\'s Massive Club'
            ],
            description: 'Valuable materials that can be sold to merchants.'
          },
          6: {
            title: '🧪 **Consumables & Potions**',
            items: [
              'small potion',
              'small mana potion'
            ],
            description: 'Items that provide temporary effects or healing.'
          },
          7: {
            title: '🐎 **Mounts & Rides**',
            items: [
              'horse',
              'orc mount',
              'Cerberus'
            ],
            description: 'Transportation that provides speed bonuses.'
          }
        };
        
        // Start with page 1
        const currentPage = 1;
        const pageData = archivePages[currentPage];
        const totalPages = Object.keys(archivePages).length;
        
        // Calculate completion for this page
        let discoveredCount = 0;
        const pageItems = pageData.items.map(item => {
          const isDiscovered = isItemDiscovered(user.id, item);
          if (isDiscovered) discoveredCount++;
          
          let emoji = '📦';
          const itemInfo = itemDatabase[item];
          if (itemInfo && itemInfo.emoji) {
            emoji = itemInfo.emoji;
          } else {
            const customEmote = getItemEmote(item);
            if (customEmote !== itemEmotes['default']) {
              emoji = customEmote;
            }
          }
          
          const status = isDiscovered ? '✅' : '❌';
          const displayName = item.charAt(0).toUpperCase() + item.slice(1);
          
          return `${status} ${emoji} **${displayName}**`;
        });
        
        const completionPercentage = Math.round((discoveredCount / pageData.items.length) * 100);
        
        // Create archive embed
        const archiveEmbed = {
          color: 0x8B4513, // Saddle brown for book theme
          title: '📚 **The Grand Archive**',
          description: `*An ancient tome containing knowledge of all items in the realm...*\n\n**Page ${currentPage} of ${totalPages}**`,
          thumbnail: {
            url: user.displayAvatarURL({ dynamic: true, size: 256 })
          },
          fields: [
            {
              name: pageData.title,
              value: pageData.description,
              inline: false
            },
            {
              name: '📖 **Collection Progress**',
              value: `${discoveredCount}/${pageData.items.length} items discovered (${completionPercentage}%)`,
              inline: false
            },
            {
              name: '📋 **Items**',
              value: pageItems.join('\n'),
              inline: false
            }
          ],
          footer: {
            text: `📚 Page ${currentPage}/${totalPages} | Use navigation buttons to browse`,
            icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          timestamp: new Date().toISOString()
        };
        
        // Create navigation buttons
        const navigationRow = {
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              label: '◀️ Previous',
              custom_id: `archive_prev_${currentPage}`,
              disabled: currentPage <= 1
            },
            {
              type: 2,
              style: 2,
              label: 'Next ▶️',
              custom_id: `archive_next_${currentPage}`,
              disabled: currentPage >= totalPages
            }
          ]
        };
        
        await interaction.reply({ 
          embeds: [archiveEmbed], 
          components: [navigationRow] 
        });
        break;

      case 'shop':
        const shopEmbed = {
          color: 0x0099FF,
          title: '🛒 Panda Shop',
          description: 'Welcome to the Panda Shop! Use your Panda Coins to buy useful items.',
          fields: [
            {
              name: '🔨 Shovel',
              value: 'Price: 3 Panda Coins\nUse it to dig for treasures! (3 uses)',
              inline: true,
            },
            {
              name: '<:axe:1400990115555311758> Axe',
              value: 'Price: 1 Panda Coin\nA basic weapon for your gear collection!',
              inline: true,
            },
            {
              name: '🏹 Bow & Arrow',
              value: 'Price: 40 Panda Coins\nPowerful ranged weapon with headshot chance!',
              inline: true,
            },
            {
              name: '🏹 Spear',
              value: 'Price: 6 Panda Coins\nUse it to hunt animals in the forest! (3 uses)',
              inline: true,
            },

          ],
          footer: {
            text: 'More items coming soon! To buy an item, use /buy <item_name>',
          },
        };

        // Add buy button components
        const shopRow = {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: 'Buy Shovel (3 🐼)',
              custom_id: 'buy_shovel',
              emoji: { name: '🔨' },
            },
            {
              type: 2,
              style: 1,
              label: 'Buy Axe (1 🐼)',
              custom_id: 'buy_axe',
              emoji: { id: '1400990115555311758', name: 'axe' },
            },
            {
              type: 2,
              style: 1,
              label: 'Buy Bow & Arrow (40 🐼)',
              custom_id: 'buy_bow',
              emoji: { name: '🏹' },
            },
            {
              type: 2,
              style: 1,
              label: 'Buy Spear (6 🐼)',
              custom_id: 'buy_spear',
              emoji: { name: '🏹' },
            },

          ],
        };

        await interaction.reply({ embeds: [shopEmbed], components: [shopRow] });
        break;

      case 'inventory':
        console.log('🎒 Inventory command triggered by user:', user.username);
        
        const userInventory = getUserInventory(user.id);
        const userGear = getUserGear(user.id);
        const userEquipped = getUserEquipped(user.id);
        const inventoryUserPets = getUserPets(user.id);
        const userEquippedPet = getUserEquippedPet(user.id);
        const inventoryUserCoins = getUserCoins(user.id);
        const inventoryItems = Object.entries(userInventory);

        // Create RPG-themed embed
        const inventoryEmbed = {
          color: 0x8B4513, // Saddle brown color for RPG theme
          title: '🎒 **Adventurer\'s Inventory**',
          description: `**${user.username}**'s treasure trove and equipment`,
          thumbnail: {
            url: user.displayAvatarURL({ dynamic: true, size: 256 })
          },
          fields: [],
          footer: {
            text: '⚔️ Adventure awaits, brave warrior! 🛡️',
            icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          timestamp: new Date().toISOString()
        };

        // Add Panda Coins field at the top
        inventoryEmbed.fields.push({
          name: '💰 **Panda Coins**',
          value: `🐼 **${inventoryUserCoins.toLocaleString()}** coins`,
          inline: false
        });

        // Add regular inventory items
        if (inventoryItems.length > 0) {
          const inventoryList = inventoryItems.map(([item, quantity]) => {
            let emoji = '📦';
            let displayName = item;

            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[item];
            if (itemInfo && itemInfo.emoji) {
              emoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(item);
              if (customEmote !== itemEmotes['default']) {
                emoji = customEmote;
              }
            }

            if (item.startsWith('shovel_')) {
              const uses = item.split('_')[1];
              displayName = `Shovel (${uses} use${uses > 1 ? 's' : ''})`;
            } else if (item.startsWith('spear_')) {
              const uses = item.split('_')[1];
              displayName = `Spear (${uses} use${uses > 1 ? 's' : ''})`;
            } else if (item === 'sock') {
              displayName = 'Mysterious Sock';
            } else if (item === 'skull') {
              displayName = 'Ancient Skull';
            } else {
              displayName = item.charAt(0).toUpperCase() + item.slice(1);
            }

            return `${emoji} **${displayName}** ×${quantity}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '📦 **Items & Consumables**',
            value: inventoryList,
            inline: false
          });
        } else {
          inventoryEmbed.fields.push({
            name: '📦 **Items & Consumables**',
            value: '🎭 *Your bag is empty, adventurer...*',
            inline: false
          });
        }

        // Add Weapons section
        const weapons = Object.entries(userGear.weapon);
        if (weapons.length > 0) {
          const weaponList = weapons.map(([weapon, quantity]) => {
            const equipped = userEquipped.weapon === weapon ? ' ⚡ **[EQUIPPED]**' : '';
            let weaponEmoji = '⚔️';
            let displayName = weapon;
            
            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[weapon];
            if (itemInfo && itemInfo.emoji) {
              weaponEmoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(weapon);
              if (customEmote !== itemEmotes['default']) {
                weaponEmoji = customEmote;
              }
            }
            
            if (weapon === 'axe') {
              displayName = 'Battle Axe';
            } else if (weapon.includes('blade')) {
              displayName = weapon.charAt(0).toUpperCase() + weapon.slice(1);
            } else if (weapon.includes('bow')) {
              displayName = 'Bow & Arrow';
            } else if (weapon.includes('arm')) {
              displayName = weapon.charAt(0).toUpperCase() + weapon.slice(1);
            }
            
            return `${weaponEmoji} **${displayName}** ×${quantity}${equipped}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '⚔️ **Weapons Arsenal**',
            value: weaponList,
            inline: true
          });
        } else {
          inventoryEmbed.fields.push({
            name: '⚔️ **Weapons Arsenal**',
            value: '🎭 *No weapons found...*',
            inline: true
          });
        }

        // Add Helmets section
        const helmets = Object.entries(userGear.helmet);
        if (helmets.length > 0) {
          const helmetList = helmets.map(([helmet, quantity]) => {
            const equipped = userEquipped.helmet === helmet ? ' ⚡ **[EQUIPPED]**' : '';
            let helmetEmoji = '🪖';
            let displayName = helmet.charAt(0).toUpperCase() + helmet.slice(1);
            
            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[helmet];
            if (itemInfo && itemInfo.emoji) {
              helmetEmoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(helmet);
              if (customEmote !== itemEmotes['default']) {
                helmetEmoji = customEmote;
              }
            }
            
            return `${helmetEmoji} **${displayName}** ×${quantity}${equipped}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '🪖 **Head Protection**',
            value: helmetList,
            inline: true
          });
        } else {
          inventoryEmbed.fields.push({
            name: '🪖 **Head Protection**',
            value: '🎭 *No helmets found...*',
            inline: true
          });
        }

        // Add Armor section
        const armor = Object.entries(userGear.armor);
        if (armor.length > 0) {
          const armorList = armor.map(([piece, quantity]) => {
            const equipped = userEquipped.armor === piece ? ' ⚡ **[EQUIPPED]**' : '';
            let armorEmoji = '🛡️';
            let displayName = piece.charAt(0).toUpperCase() + piece.slice(1);
            
            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[piece];
            if (itemInfo && itemInfo.emoji) {
              armorEmoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(piece);
              if (customEmote !== itemEmotes['default']) {
                armorEmoji = customEmote;
              }
            }
            
            return `${armorEmoji} **${displayName}** ×${quantity}${equipped}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '🛡️ **Body Armor**',
            value: armorList,
            inline: true
          });
        } else {
          inventoryEmbed.fields.push({
            name: '🛡️ **Body Armor**',
            value: '🎭 *No armor found...*',
            inline: true
          });
        }

        // Add Rides section
        const rides = Object.entries(userGear.ride);
        if (rides.length > 0) {
          const rideList = rides.map(([ride, quantity]) => {
            const equipped = userEquipped.ride === ride ? ' ⚡ **[EQUIPPED]**' : '';
            let rideEmoji = '🐎';
            let displayName = ride.charAt(0).toUpperCase() + ride.slice(1);
            
            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[ride];
            if (itemInfo && itemInfo.emoji) {
              rideEmoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(ride);
              if (customEmote !== itemEmotes['default']) {
                rideEmoji = customEmote;
              }
            }
            
            return `${rideEmoji} **${displayName}** ×${quantity}${equipped}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '🐎 **Mounts & Rides**',
            value: rideList,
            inline: true
          });
        } else {
          inventoryEmbed.fields.push({
            name: '🐎 **Mounts & Rides**',
            value: '🎭 *No mounts found...*',
            inline: true
          });
        }

        // Add Pets section
        if (inventoryUserPets && Object.keys(inventoryUserPets).length > 0) {
          const petList = Object.entries(inventoryUserPets).map(([pet, quantity]) => {
            const equipped = userEquippedPet === pet ? ' ⚡ **[ACTIVE]**' : '';
            let petEmoji = '🐾';
            let displayName = pet.charAt(0).toUpperCase() + pet.slice(1);
            
            // Get emoji from itemDatabase first, then fallback to custom emotes
            const itemInfo = itemDatabase[pet];
            if (itemInfo && itemInfo.emoji) {
              petEmoji = itemInfo.emoji;
            } else {
              // Use custom emote if available, otherwise use database emoji
              const customEmote = getItemEmote(pet);
              if (customEmote !== itemEmotes['default']) {
                petEmoji = customEmote;
              }
            }
            
            if (pet.includes('bunny')) {
              displayName = 'Bunny Companion';
            } else if (pet.includes('goblin')) {
              displayName = 'Goblin Pet';
            }
            
            return `${petEmoji} **${displayName}** ×${quantity}${equipped}`;
          }).join('\n');
          
          inventoryEmbed.fields.push({
            name: '🐾 **Companions & Pets**',
            value: petList,
            inline: true
          });
        } else {
          inventoryEmbed.fields.push({
            name: '🐾 **Companions & Pets**',
            value: '🎭 *No companions found...*',
            inline: true
          });
        }

        // Add empty field for spacing
        inventoryEmbed.fields.push({
          name: '\u200b',
          value: '\u200b',
          inline: true
        });

        await interaction.reply({ embeds: [inventoryEmbed] });
        console.log('✅ Inventory command completed successfully');
        break;

      case 'dig':
        const inventory = getUserInventory(user.id);
        let shovelItem = null;
        let shovelUses = 0;

        // FIFO system - use shovels with lowest durability first (oldest/most used shovels)
        // Check for shovels in order: 1 use -> 2 uses -> 3 uses -> old format
        for (let uses = 1; uses <= 3; uses++) {
          if (inventory[`shovel_${uses}`] && inventory[`shovel_${uses}`] > 0) {
            shovelItem = `shovel_${uses}`;
            shovelUses = uses;
            break;
          }
        }

        // Also check for old shovels (for backwards compatibility)
        if (!shovelItem && inventory['shovel'] && inventory['shovel'] > 0) {
          shovelItem = 'shovel';
          shovelUses = 1;
        }

        if (!shovelItem) {
          await interaction.reply('❌ You need a shovel to dig! Buy one from the shop with `/shop`.');
          break;
        }

        // Remove current shovel and add reduced durability shovel if applicable
        removeItemFromInventory(user.id, shovelItem, 1);

        let shovelMessage = '';
        if (shovelUses > 1) {
          const newUses = shovelUses - 1;
          addItemToInventory(user.id, `shovel_${newUses}`, 1);
          shovelMessage = `*Your shovel now has ${newUses} use${newUses > 1 ? 's' : ''} remaining*`;
        } else {
          shovelMessage = '*Your shovel broke from use*';
        }

        // Generate random outcome with luck bonuses
        const random = Math.random() * 100;
        let reward = '';
        let rewardEmoji = '';
        let pursuitBonus = '';

        // Calculate pursuit luck bonuses for each item
        const sockBonus = getLuckDropBonus(user.id, 'sock');
        const skullBonus = getLuckDropBonus(user.id, 'skull');
        const bunnyBonus = getLuckDropBonus(user.id, 'bunny pet');

        // Apply luck bonuses to chances
        let nothingChance = 30;
        let sockChance = 36 + sockBonus; // Reduced from 44 to make room for new items
        let coinsChance1 = 16.25;
        let skullChance = 6.5 + skullBonus;
        let coinsChance2 = 1.95;
        let coinsChance3 = 1.17;
        let bunnyChance = 0.13 + bunnyBonus;
        let helmetChance = 8; // 8% chance for old worn helmet
        let armorChance = 8; // 8% chance for old worn armor

        // Determine outcome based on modified chances
        if (random < nothingChance) {
          reward = 'nothing... just dirt and disappointment';
          rewardEmoji = '💨';
        } else if (random < nothingChance + sockChance) {
          addItemToInventory(user.id, 'sock', 1);
          reward = 'a sock';
          rewardEmoji = '🧦';
          if (sockBonus > 0) pursuitBonus = ` *(+${sockBonus.toFixed(2)}% luck bonus)*`;
        } else if (random < nothingChance + sockChance + coinsChance1) {
          addCoins(user.id, 2, guild);
          reward = '2 Panda Coins';
          rewardEmoji = '🐼';
        } else if (random < nothingChance + sockChance + coinsChance1 + skullChance) {
          addItemToInventory(user.id, 'skull', 1);
          reward = 'a skull';
          rewardEmoji = '💀';
          if (skullBonus > 0) pursuitBonus = ` *(+${skullBonus.toFixed(2)}% luck bonus)*`;
        } else if (random < nothingChance + sockChance + coinsChance1 + skullChance + coinsChance2) {
          addCoins(user.id, 6, guild);
          reward = '6 Panda Coins';
          rewardEmoji = '🐼';
        } else if (random < nothingChance + sockChance + coinsChance1 + skullChance + coinsChance2 + coinsChance3) {
          addCoins(user.id, 10, guild);
          reward = '10 Panda Coins';
          rewardEmoji = '🐼';
        } else if (random < nothingChance + sockChance + coinsChance1 + skullChance + coinsChance2 + coinsChance3 + helmetChance) {
          addGearToInventory(user.id, 'helmet', 'old worn helmet', 1);
          reward = 'an Old Worn Helmet!';
          rewardEmoji = '🪖';
        } else if (random < nothingChance + sockChance + coinsChance1 + skullChance + coinsChance2 + coinsChance3 + helmetChance + armorChance) {
          addGearToInventory(user.id, 'armor', 'old worn armor', 1);
          reward = 'Old Worn Armor!';
          rewardEmoji = '🛡️';
        } else {
          addPetToInventory(user.id, 'bunny pet', 1);
          reward = 'a Bunny Pet!';
          rewardEmoji = '🐰';
          if (bunnyBonus > 0) pursuitBonus = ` *(+${bunnyBonus.toFixed(2)}% luck bonus)*`;
        }

        const assignedRole = await checkAndAssignRoles(user.id, guild.id, guild);
        let response = `🔨 You used your shovel to dig...\n${getItemEmote(reward.replace('a ', '').replace('an ', ''))} You found **${reward}**!${pursuitBonus}\n\n${shovelMessage}`;

        if (assignedRole) {
          response += `\n\n🎉 Congratulations! You've earned the **${assignedRole.name}** role!`;
        }

        // Add quest tracking
        updateDigCount(user.id);
        const digQuestCompletion = checkQuestCompletion(user.id, 'dig', 0);

        if (digQuestCompletion.completed) {
          response += `\n\n🎯 **QUEST COMPLETED: ${digQuestCompletion.questName}**\n💰 Reward: ${digQuestCompletion.reward} Panda Coins\n📝 ${digQuestCompletion.description}\n🎁 Use /quest to claim your reward!`;
        }

        await interaction.reply(response);
        break;

      case 'hunt':
        const huntInventory = getUserInventory(user.id);
        let spearItem = null;
        let spearUses = 0;

        // FIFO system - use spears with lowest durability first
        for (let uses = 1; uses <= 3; uses++) {
          if (huntInventory[`spear_${uses}`] && huntInventory[`spear_${uses}`] > 0) {
            spearItem = `spear_${uses}`;
            spearUses = uses;
            break;
          }
        }

        // Also check for old spears (for backwards compatibility)
        if (!spearItem && huntInventory['spear'] && huntInventory['spear'] > 0) {
          spearItem = 'spear';
          spearUses = 1;
        }

        if (!spearItem) {
          await interaction.reply('❌ You need a spear to hunt! Buy one from the shop with `/shop`.');
          break;
        }

        // Remove current spear and add reduced durability spear if applicable
        removeItemFromInventory(user.id, spearItem, 1);

        let spearMessage = '';
        if (spearUses > 1) {
          const newUses = spearUses - 1;
          addItemToInventory(user.id, `spear_${newUses}`, 1);
          spearMessage = `*Your spear now has ${newUses} use${newUses > 1 ? 's' : ''} remaining*`;
        } else {
          spearMessage = '*Your spear broke from use*';
        }

        // Generate random hunting outcome
        const huntRandom = Math.random() * 100;
        let huntReward = '';
        let huntRewardEmoji = '';
        let huntMessage = '';

        // Hunting chances
        const huntNothingChance = 25; // 25% chance of nothing
        const huntReindeerChance = 44.7; // 44.7% chance of reindeer (reduced from 45)
        const huntPouchChance = 15; // 15% chance of coin pouch
        const huntWolfChance = 8; // 8% chance of wolf
        const huntBearChance = 5; // 5% chance of bear
        const huntRareChance = 2; // 2% chance of rare animal
        const huntShinyAntlerChance = 0.3; // 0.3% chance of shiny antlers

        // Determine hunting outcome
        if (huntRandom < huntNothingChance) {
          huntReward = 'nothing... the forest is quiet today';
          huntRewardEmoji = '🌲';
          huntMessage = 'You stalk through the forest, but no animals are in sight. The hunt yields nothing.';
        } else if (huntRandom < huntNothingChance + huntReindeerChance) {
          addItemToInventory(user.id, 'reindeer skin', 1);
          huntReward = 'a Reindeer Skin';
          huntRewardEmoji = '🦌';
          huntMessage = 'You spot a majestic reindeer grazing! Your spear finds its mark, and you harvest its skin.';
        } else if (huntRandom < huntNothingChance + huntReindeerChance + huntPouchChance) {
          addCoins(user.id, 6, guild);
          huntReward = '6 Panda Coins';
          huntRewardEmoji = '💰';
          huntMessage = 'Something rustles in the bushes! You throw your spear and find a pouch containing coins.';
        } else if (huntRandom < huntNothingChance + huntReindeerChance + huntPouchChance + huntWolfChance) {
          addItemToInventory(user.id, 'wolf pelt', 1);
          huntReward = 'a Wolf Pelt';
          huntRewardEmoji = '🐺';
          huntMessage = 'A fierce wolf emerges from the shadows! After a tense battle, you claim its pelt.';
        } else if (huntRandom < huntNothingChance + huntReindeerChance + huntPouchChance + huntWolfChance + huntBearChance) {
          addItemToInventory(user.id, 'bear claw', 1);
          huntReward = 'a Bear Claw';
          huntRewardEmoji = '🐻';
          huntMessage = 'A massive bear charges! Your spear strikes true, and you collect one of its claws.';
        } else if (huntRandom < huntNothingChance + huntReindeerChance + huntPouchChance + huntWolfChance + huntBearChance + huntRareChance + huntShinyAntlerChance) {
          addGearToInventory(user.id, 'helmet', 'shiny reindeer antlers', 1);
          huntReward = 'Shiny Reindeer Antlers';
          huntRewardEmoji = '🦌✨';
          huntMessage = 'A mystical reindeer with glowing antlers appears! This is beyond rare! You carefully harvest its magical antlers.';
        } else {
          addItemToInventory(user.id, 'golden deer antler', 1);
          huntReward = 'a Golden Deer Antler';
          huntRewardEmoji = '🦌✨';
          huntMessage = 'A magnificent golden deer appears! This is incredibly rare! You carefully harvest its antler.';
        }

        // Update hunt count for quest tracking
        updateHuntCount(user.id);
        
        // Check for hunt quest completion
        const huntQuestCompletion = checkQuestCompletion(user.id, 'hunt', 0);
        
        let huntResponse = `🏹 ${huntMessage}\n\nYou found ${getItemEmote(huntReward.replace('a ', '').replace('an ', ''))} **${huntReward}**! ${spearMessage}`;
        
        if (huntQuestCompletion.completed) {
          huntResponse += `\n\n🎯 **QUEST COMPLETED: ${huntQuestCompletion.questName}**\n💰 Reward: ${huntQuestCompletion.reward} Panda Coins\n📝 ${huntQuestCompletion.description}\n🎁 Use /quest to claim your reward!`;
        }
        
        await interaction.reply(huntResponse);
        break;

      case 'mute':
        // Check if user has permission to mute members
        if (!member.permissions.has('ModerateMembers')) {
          return await interaction.reply({ content: '❌ You don\'t have permission to mute members!', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = await guild.members.fetch(targetUser.id);

        if (!targetMember) {
          return await interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        // Check if bot can mute this member
        if (!targetMember.moderatable) {
          return await interaction.reply({ content: '❌ I cannot mute this user (they may have higher permissions than me)!', ephemeral: true });
        }

        // Mute the member (timeout for 10 minutes by default)
        await targetMember.timeout(10 * 60 * 1000, `Muted by ${user.tag}`);

        // Send DM to the muted user
        try {
          await targetUser.send(`You have been muted by <@${user.id}> in ${guild.name}`);
        } catch (dmError) {
          console.log('Could not send DM to muted user (DMs may be disabled)');
        }

        await interaction.reply(`<@${targetUser.id}> has been muted`);
        break;

      case 'unmute':
        // Check if user has permission to moderate members
        if (!member.permissions.has('ModerateMembers')) {
          return await interaction.reply({ content: '❌ You don\'t have permission to unmute members!', ephemeral: true });
        }

        const targetUnmuteUser = interaction.options.getUser('user');
        const targetUnmuteMember = await guild.members.fetch(targetUnmuteUser.id);

        if (!targetUnmuteMember) {
          return await interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        // Check if bot can unmute this member
        if (!targetUnmuteMember.moderatable) {
          return await interaction.reply({ content: '❌ I cannot unmute this user (they may have higher permissions than me)!', ephemeral: true });
        }

        // Remove timeout (unmute the member)
        await targetUnmuteMember.timeout(null, `Unmuted by ${user.tag}`);

        await interaction.reply(`<@${targetUnmuteUser.id}> has been unmuted`);
        break;

      case 'setrole':
        // Check if user has permission to manage roles
        if (!member.permissions.has('ManageRoles')) {
          return await interaction.reply({ content: '❌ You don\'t have permission to manage roles!', ephemeral: true });
        }

        const coinsRequired = interaction.options.getInteger('coins');
        const targetRole = interaction.options.getRole('role');

        // Validate inputs
        if (coinsRequired < 1) {
          return await interaction.reply({ content: '❌ Coins required must be at least 1!', ephemeral: true });
        }

        // Check if bot can assign this role
        if (targetRole.position >= guild.members.me.roles.highest.position) {
          return await interaction.reply({ content: '❌ I cannot assign this role as it\'s higher than or equal to my highest role!', ephemeral: true });
        }

        // Set the role milestone
        setRoleMilestone(guild.id, coinsRequired, targetRole.id);

        await interaction.reply(`✅ Role milestone set! Users will receive the **${targetRole.name}** role when they reach **${coinsRequired}** Panda Coins.`);
        break;

      case 'milestones':
        const guildMilestones = roleMilestones[guild.id];

        if (!guildMilestones || Object.keys(guildMilestones).length === 0) {
          await interaction.reply('📊 No role milestones have been set for this server yet!\nUse `/setrole` to create some milestones.');
          break;
        }

        // Sort milestones by coin amount
        const sortedMilestones = Object.entries(guildMilestones)
          .map(([coins, roleId]) => ({ coins: parseInt(coins), roleId }))
          .sort((a, b) => a.coins - b.coins);

        const milestoneList = sortedMilestones.map(milestone => {
          const role = guild.roles.cache.get(milestone.roleId);
          const roleName = role ? role.name : 'Unknown Role';
          return `🐼 **${milestone.coins}** coins → **${roleName}**`;
        }).join('\n');

        const milestonesEmbed = {
          color: 0x0099FF,
          title: '📊 Role Milestones',
          description: `Here are all the role milestones for **${guild.name}**:\n\n${milestoneList}`,
          footer: {
            text: 'Users will automatically receive roles when they reach the required Panda Coins!',
          },
        };

        await interaction.reply({ embeds: [milestonesEmbed] });
        break;

      case 'help':
        const helpEmbed = {
          color: 0x0099FF,
          title: '🐼 Panzu Bot - Complete Command Guide',
          description: 'Here\'s everything you need to know about using Panzu Bot!',
          fields: [
            {
              name: '🚀 Getting Started Guide',
              value: '**New Player? Here\'s how to get started:**\n\n1️⃣ **Claim free coins:** `/pocket` (every 5 hours)\n2️⃣ **Buy a shovel:** `/shop` → Shovel (3 coins)\n3️⃣ **Dig for gear:** `/dig` to find basic armor\n4️⃣ **Equip your gear:** `/equip helmet old worn helmet`\n5️⃣ **Fight enemies:** `/dungeon` → The Goblin\n\n*Tip: The new "Old Worn" gear helps new players survive battles!*',
              inline: false,
            },
            {
              name: '💰 Economy Commands',
              value: '`/pocket` - Claim your 3 Panda Coins (5h cooldown)\n`/wallet` or `/balance` - Check your Panda Coin balance\n`/shop` - Browse and buy items with Panda Coins\n`/inventory` - View your items and gear collection',
              inline: false,
            },
            {
              name: '🎮 Activity Commands',
              value: '`/dig` - Use a shovel to dig for treasures!\n• 30% chance: Nothing 💨\n• 31% chance: Sock 🧦\n• 16.25% chance: 2 Panda Coins 🐼\n• 6.5% chance: Skull 💀\n• 1.95% chance: 6 Panda Coins 🐼\n• 1.17% chance: 10 Panda Coins 🐼\n• **8% chance: Old Worn Helmet** 🪖\n• **8% chance: Old Worn Armor** 🛡️\n• 0.13% chance: Bunny Pet 🐰\n*Note: Shovel has 3 uses before breaking*\n\n`/hunt` - Use a spear to hunt animals!\n• 25% chance: Nothing 🌲\n• 44.7% chance: Reindeer Skin 🦌 (sells for 2 coins)\n• 15% chance: 6 Panda Coins 💰\n• 8% chance: Wolf Pelt 🐺 (sells for 4 coins)\n• 5% chance: Bear Claw 🐻 (sells for 8 coins)\n• 2% chance: Golden Deer Antler 🦌✨ (sells for 15 coins)\n• **0.3% chance: Shiny Reindeer Antlers** 🦌✨ (helmet: +9 health, +5 defense, +2 luck)\n*Note: Spear has 3 uses before breaking*',
              inline: false,
            },
            {
              name: '🛒 Shop Items',
              value: '🔨 **Shovel** - 3 Panda Coins\n• Use with `/dig` to find treasures\n• Has 3 uses before breaking\n\n🏹 **Spear** - 6 Panda Coins\n• Use with `/hunt` to hunt animals\n• Has 3 uses before breaking\n\n<:axe:1400990115555311758> **Axe** - 1 Panda Coin\n• Basic weapon for your gear collection\n• Use `/equip weapon axe` to equip it\n\n🏹 **Bow & Arrow** - 40 Panda Coins\n• Powerful ranged weapon with headshot chance\n• Use `/equip weapon bow & arrow` to equip it\n\n*More items coming soon!*',
              inline: false,
            },
            {
              name: '⚔️ Gear System',
              value: 'Your inventory includes 4 gear categories:\n• **Weapons** ⚔️ - Combat gear\n• **Helmets** 🪖 - Head protection\n• **Armor** 🛡️ - Body protection\n• **Rides** 🐎 - Transportation/mounts\n\n`/equip <category> <item>` - Equip gear to your character\n`/unequip <category>` - Unequip gear from your character\n• Equipped items are marked with **[EQUIPPED]** in inventory',
              inline: false,
            },
            {
              name: '🎭 Role Milestones',
              value: '`/milestones` - View server role rewards\n• Automatically earn roles as you collect Panda Coins!\n• Server admins can set milestones with `/setrole`',
              inline: false,
            },
            {
              name: '🛡️ Moderation Commands (Staff Only)',
              value: '`/mute <user>` - Timeout user for 10 minutes\n`/unmute <user>` - Remove timeout from user\n`/setrole <coins> <role>` - Set role milestone\n`/grant <user> <role>` - Grant any role to a user (Admin only)\n*Requires appropriate permissions*',
              inline: false,
            },
            {
              name: '🐾 Pet & Adventure Commands',
              value: '`/pet` - View your equipped pet and pet collection\n`/dungeon` - Enter dungeons to fight enemies and collect gear\n• Gear can have luck stats that improve drop rates\n• Rare pets provide luck and other stat bonuses',
              inline: false,
            },
            {
              name: '📚 Archive System',
              value: '`/archive` - Browse the grand archive to discover all items in the game\n• View all available items organized by category\n• Track your collection progress with checkboxes\n• Navigate through pages like a book\n• See completion percentages for each category\n• Future benefits based on collection completion!',
              inline: false,
            },
            {
              name: '📊 Other Commands',
              value: '`/ping` - Test bot responsiveness\n`/help` - Show this help guide (sent to DMs)\n`/equip <category> <item>` - Equip gear to your character\n`/unequip <category>` - Unequip gear from your character\n`/player` - View your character stats and equipped gear\n`/archive` - Browse the archive to discover all items in the game',
              inline: false,
            },
            {
              name: '💡 Tips',
              value: '• Check `/shop` regularly for new items\n• Use `/pocket` every 5 hours for free coins\n• Save up coins for better gear and activities\n• Role milestones give you special server perks\n• Items and activities will expand over time!',
              inline: false,
            },
          ],
          footer: {
            text: 'Panzu Bot is constantly growing! More features coming soon.',
          },
          timestamp: new Date().toISOString(),
        };

        try {
          await user.send({ embeds: [helpEmbed] });
          await interaction.reply({ content: '📨 Help guide sent to your DMs! Check your messages.', ephemeral: true });
        } catch (dmError) {
          console.log('Could not send DM to user (DMs may be disabled)');
          await interaction.reply({ content: '❌ I couldn\'t send you a DM! Please make sure your DMs are enabled and try again.\n\n*Alternatively, you can view basic command info by typing `/` and browsing the command list.*', ephemeral: true });
        }
        break;

      case 'equip':
        const gearCategory = interaction.options.getString('category');
        const itemName = interaction.options.getString('item').toLowerCase();

        if (gearCategory === 'pet') {
          // Equip a pet
          if (!equipPet(user.id, itemName)) {
            await interaction.reply({ content: `❌ You don't have a pet named ${itemName}!`, ephemeral: true });
            break;
          }
          await interaction.reply(`✅ You equipped **${itemName}** as your pet!`);
        } else {
        // Check if user has the item
          if (!hasGear(user.id, gearCategory, itemName)) {
            await interaction.reply({ content: `❌ You don't have a ${itemName} in your ${gearCategory} collection!`, ephemeral: true });
            break;
          }

          // Equip the item
          if (equipGear(user.id, gearCategory, itemName)) {
            const categoryEmojis = {
              weapon: '⚔️',
              helmet: '🪖',
              armor: '🛡️',
              ride: '🐎'
            };

            // Update power count and check power quest completion after equipping
            updatePowerCount(user.id);
            const powerQuestCompletion = checkQuestCompletion(user.id, 'power', 0);

            let response = `✅ ${categoryEmojis[gearCategory]} You equipped your **${itemName}**! Use \`/inventory\` to see your equipped gear.`;

            if (powerQuestCompletion.completed) {
              response += `\n\n🎯 **QUEST COMPLETED: ${powerQuestCompletion.questName}**\n💰 Reward: ${powerQuestCompletion.reward} Panda Coins\n📝 ${powerQuestCompletion.description}\n🎁 Use /quest to claim your reward!`;
            }

            await interaction.reply(response);
          } else {
            await interaction.reply({ content: '❌ Failed to equip item. Please try again.', ephemeral: true });
          }
        }
        break;

      case 'unequip':
        const unequipCategory = interaction.options.getString('category');
        const unequipItem = interaction.options.getString('item');

        if (unequipCategory === 'pet') {
          // Unequip pet
          const currentPet = getUserEquippedPet(user.id);
          if (!currentPet) {
            await interaction.reply({ content: `❌ You don't have a pet equipped!`, ephemeral: true });
            break;
          }
          
          // If specific item is provided, verify it matches
          if (unequipItem && currentPet.toLowerCase() !== unequipItem.toLowerCase()) {
            await interaction.reply({ content: `❌ You don't have **${unequipItem}** equipped! You have **${currentPet}** equipped.`, ephemeral: true });
            break;
          }
          
          // Remove pet from equipped
          if (pandaCoinData[user.id] && pandaCoinData[user.id].equippedPet) {
            delete pandaCoinData[user.id].equippedPet;
            savePandaCoinData();
            await interaction.reply(`✅ You unequipped your **${currentPet}** pet!`);
          } else {
            await interaction.reply({ content: '❌ Failed to unequip pet. Please try again.', ephemeral: true });
          }
        } else {
          // Unequip gear
          const playerEquipped = getUserEquipped(user.id);
          const currentItem = playerEquipped[unequipCategory];
          
          if (!currentItem) {
            await interaction.reply({ content: `❌ You don't have anything equipped in your ${unequipCategory} slot!`, ephemeral: true });
            break;
          }

          // If specific item is provided, verify it matches
          if (unequipItem && currentItem.toLowerCase() !== unequipItem.toLowerCase()) {
            await interaction.reply({ content: `❌ You don't have **${unequipItem}** equipped in your ${unequipCategory} slot! You have **${currentItem}** equipped.`, ephemeral: true });
            break;
          }

          // Remove gear from equipped
          if (pandaCoinData[user.id] && pandaCoinData[user.id].equipped && pandaCoinData[user.id].equipped[unequipCategory]) {
            delete pandaCoinData[user.id].equipped[unequipCategory];
            savePandaCoinData();
            
            const categoryEmojis = {
              weapon: '⚔️',
              helmet: '🪖',
              armor: '🛡️',
              ride: '🐎'
            };

            await interaction.reply(`✅ ${categoryEmojis[unequipCategory]} You unequipped your **${currentItem}**!`);
          } else {
            await interaction.reply({ content: '❌ Failed to unequip item. Please try again.', ephemeral: true });
          }
        }
        break;

      case 'player':
        const playerStats = getUserStats(user.id);
        const playerEquipped = getUserEquipped(user.id);

        // Create equipped gear display
        let equippedDisplay = '';
        const categoryEmojis = {
          weapon: '⚔️',
          helmet: '🪖',
          armor: '🛡️',
          ride: '🐎'
        };

        Object.entries(playerEquipped).forEach(([category, item]) => {
          if (item) {
            const itemEmoji = category === 'weapon' && item === 'axe' ? '<:axe:1400990115555311758>' : categoryEmojis[category];
            equippedDisplay += `${itemEmoji} **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${item}\n`;
          } else {
            equippedDisplay += `${categoryEmojis[category]} **${category.charAt(0).toUpperCase() + category.slice(1)}:** None\n`;
          }
        });

        // Check for active gear set bonuses
        const activeSetBonuses = getActiveGearSetBonuses(user.id);
        
        // Calculate total power for ranking
        const totalPower = playerStats.health + playerStats.attack + playerStats.defense + playerStats.speed + playerStats.luck;
        
        // Determine player rank based on total power
        let playerRank = '🆕 Novice';
        let rankColor = 0x808080; // Gray
        let rankDescription = 'Just starting your adventure!';
        
        if (totalPower >= 50) {
          playerRank = '🌟 Legend';
          rankColor = 0xFFD700; // Gold
          rankDescription = 'A true master of the realm!';
        } else if (totalPower >= 40) {
          playerRank = '💎 Elite';
          rankColor = 0x9900FF; // Purple
          rankDescription = 'Among the most powerful warriors!';
        } else if (totalPower >= 30) {
          playerRank = '🔵 Veteran';
          rankColor = 0x0099FF; // Blue
          rankDescription = 'Experienced and battle-hardened!';
        } else if (totalPower >= 20) {
          playerRank = '🟢 Adept';
          rankColor = 0x00FF00; // Green
          rankDescription = 'Growing stronger with each battle!';
        } else if (totalPower >= 10) {
          playerRank = '🟡 Apprentice';
          rankColor = 0xFFFF00; // Yellow
          rankDescription = 'Learning the ways of combat!';
        }
        
        // Calculate stat percentages for visual bars (fixed max of 20)
        const maxStatForBars = 20; // Fixed maximum for better visual representation
        const createStatBar = (value, maxValue) => {
          const filled = Math.max(0, Math.min(10, Math.round((value / maxValue) * 10)));
          return '█'.repeat(filled) + '░'.repeat(10 - filled);
        };
        
        // Get current mana and calculate time until next mana point
        const currentMana = getUserMana(user.id);
        const maxMana = 100;
        const now = Date.now();
        
        // Simple countdown timer approach
        const countdownStart = pandaCoinData[user.id]?.countdownStart || now;
        const timeSinceCountdownStart = now - countdownStart;
        const secondsRemaining = Math.max(0, 60 - Math.floor(timeSinceCountdownStart / 1000));
        const timeUntilNextMana = secondsRemaining;
        
        // Debug logging for time calculation
        console.log(`🔮 Simple countdown timer for ${user.id}:`);
        console.log(`  - Current mana: ${currentMana}`);
        console.log(`  - Countdown start: ${new Date(countdownStart).toLocaleString()}`);
        console.log(`  - Time since countdown start: ${Math.floor(timeSinceCountdownStart / 1000)}s`);
        console.log(`  - Seconds remaining: ${secondsRemaining}s`);
        console.log(`  - Display time: ${timeUntilNextMana}s`);
        

        
        // Format time display
        const formatTime = (seconds) => {
          if (seconds < 60) return `${Math.ceil(seconds)}s`;
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.ceil(seconds % 60);
          return `${minutes}m ${remainingSeconds}s`;
        };
        
        // Create mana bar (max 100 mana)
        const createManaBar = (current, max) => {
          const filled = Math.round((current / max) * 10);
          return '█'.repeat(filled) + '░'.repeat(10 - filled);
        };
        
        // Create fancy stat display with bars (including mana)
        const statsDisplay = `❤️ **Health:** ${playerStats.health}\n\`${createStatBar(playerStats.health, maxStatForBars)}\`\n\n⚔️ **Attack:** ${playerStats.attack}\n\`${createStatBar(playerStats.attack, maxStatForBars)}\`\n\n🛡️ **Defense:** ${playerStats.defense}\n\`${createStatBar(playerStats.defense, maxStatForBars)}\`\n\n⚡ **Speed:** ${playerStats.speed}\n\`${createStatBar(playerStats.speed, maxStatForBars)}\`\n\n🍀 **Luck:** ${playerStats.luck}\n\`${createStatBar(playerStats.luck, maxStatForBars)}\`\n\n🔮 **Mana:** ${currentMana}/${maxMana}\n\`${createManaBar(currentMana, maxMana)}\`\n⏰ **1+ Mana in:** ${formatTime(timeUntilNextMana)}`;
        
        // Create equipped gear display with icons
        const equippedDisplayFancy = Object.entries(playerEquipped).map(([category, item]) => {
          if (item) {
            const itemEmoji = category === 'weapon' && item === 'axe' ? '<:axe:1400990115555311758>' : categoryEmojis[category];
            return `${itemEmoji} **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${item}`;
          } else {
            return `${categoryEmojis[category]} **${category.charAt(0).toUpperCase() + category.slice(1)}:** None`;
          }
        }).join('\n');
        
        // Create achievements section
        const achievements = [];
        if (playerStats.health >= 15) achievements.push('🏆 **Tank Master** - High health pool');
        if (playerStats.attack >= 5) achievements.push('⚔️ **Damage Dealer** - High attack power');
        if (playerStats.defense >= 10) achievements.push('🛡️ **Iron Wall** - Excellent defense');
        if (playerStats.luck >= 3) achievements.push('🍀 **Lucky Charm** - High luck stat');
        if (totalPower >= 30) achievements.push('💪 **Powerhouse** - Total power over 30');
        if (Object.values(playerEquipped).some(item => item)) achievements.push('🎒 **Gear Collector** - Has equipped items');
        
        const achievementsDisplay = achievements.length > 0 ? achievements.join('\n') : 'No achievements yet. Keep playing to earn them!';
        
        const embedFields = [
          {
            name: '📊 Character Stats',
            value: statsDisplay,
            inline: true,
          },
          {
            name: '🎒 Equipped Gear',
            value: equippedDisplayFancy,
            inline: true,
          },
          {
            name: '🏆 Achievements',
            value: achievementsDisplay,
            inline: false,
          },
        ];

        // Add gear set bonus field if any are active
        if (activeSetBonuses.length > 0) {
          let setBonusDisplay = '';
          activeSetBonuses.forEach(setBonus => {
            const bonusStats = Object.entries(setBonus.bonuses).map(([stat, value]) => {
              const statEmojis = {
                attack: '⚔️',
                defense: '🛡️',
                health: '❤️',
                speed: '⚡',
                luck: '🍀'
              };
              return `${statEmojis[stat]} +${value} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
            }).join(', ');

            setBonusDisplay += `✨ **${setBonus.name}** - ${bonusStats}\n`;
          });

          embedFields.push({
            name: '✨ Gear Set Bonus Activated!',
            value: setBonusDisplay,
            inline: false,
          });
        }

        // Get level information
        const levelInfo = getLevelProgress(user.id);
        const levelDisplay = `🎯 **Level:** ${levelInfo.level} | ⭐ **EXP:** ${levelInfo.currentExp}/${levelInfo.expForNext} (${levelInfo.progress.toFixed(1)}%)`;
        
        const playerEmbed = {
          color: rankColor,
          title: `${playerRank} ${user.username}`,
          description: `**${rankDescription}**\n\n💪 **Total Power:** ${totalPower} | ${levelDisplay}`,
          thumbnail: {
            url: user.displayAvatarURL({ dynamic: true, size: 256 }),
          },
          fields: embedFields,
          footer: {
            text: `Use /equip and /unequip to manage your gear | Total Power: ${totalPower}`,
          },
          timestamp: new Date().toISOString(),
        };

        // Send initial embed
        const reply = await interaction.reply({ embeds: [playerEmbed], fetchReply: true });

        // Start live timer updates (every 10 seconds for 5 minutes)
        let updateCount = 0;
        const maxUpdates = 30; // 5 minutes (30 * 10 seconds)
        
        const updateTimer = setInterval(async () => {
          try {
            updateCount++;
            
            // Get current mana and recalculate timer
            const currentMana = getUserMana(user.id);
            const countdownStart = pandaCoinData[user.id]?.countdownStart || Date.now();
            const now = Date.now();
            const timeSinceCountdownStart = now - countdownStart;
            const secondsRemaining = Math.max(0, 60 - Math.floor(timeSinceCountdownStart / 1000));
            const displayTime = Math.ceil(secondsRemaining);
            const formattedTime = formatTime(displayTime);

            // Update the mana field in embedFields
            const updatedEmbedFields = embedFields.map(field => {
              if (field.name === '📊 Character Stats') {
                const updatedStatsDisplay = `❤️ **Health:** ${playerStats.health}\n\`${createStatBar(playerStats.health, maxStatForBars)}\`\n\n⚔️ **Attack:** ${playerStats.attack}\n\`${createStatBar(playerStats.attack, maxStatForBars)}\`\n\n🛡️ **Defense:** ${playerStats.defense}\n\`${createStatBar(playerStats.defense, maxStatForBars)}\`\n\n⚡ **Speed:** ${playerStats.speed}\n\`${createStatBar(playerStats.speed, maxStatForBars)}\`\n\n🍀 **Luck:** ${playerStats.luck}\n\`${createStatBar(playerStats.luck, maxStatForBars)}\`\n\n🔮 **Mana:** ${currentMana}/${maxMana}\n\`${createManaBar(currentMana, maxMana)}\`\n⏰ **1+ Mana in:** ${formattedTime}`;
                return {
                  ...field,
                  value: updatedStatsDisplay
                };
              }
              return field;
            });

            const updatedEmbed = {
              ...playerEmbed,
              fields: updatedEmbedFields
            };

            await reply.edit({ embeds: [updatedEmbed] });
            
            // Stop updating after 5 minutes or if timer reaches 0
            if (updateCount >= maxUpdates || secondsRemaining <= 0) {
              clearInterval(updateTimer);
            }
          } catch (error) {
            console.error('Error updating live timer:', error);
            clearInterval(updateTimer);
          }
        }, 10000); // Update every 10 seconds
        break;

      case 'pet':
        const equippedPet = getUserEquippedPet(user.id);
        const petUserPets = getUserPets(user.id);
        const petEntries = Object.entries(petUserPets);

        // Pet descriptions for Pokémon card style
        const petDescriptions = {
          'bunny pet': 'A fluffy companion with boundless energy and a heart full of love. This adorable bunny brings good fortune to its trainer and never fails to brighten even the darkest dungeon.',
          'goblin pet': 'A mischievous little creature with sharp wit and cunning nature. Despite its chaotic appearance, this goblin companion provides valuable assistance in battle.',
          'knight companion': 'A noble and loyal companion with unwavering dedication. This legendary pet represents the highest honor and brings incredible power to its trainer.'
        };

        // Pet rarity levels
        const petRarity = {
          'bunny pet': 'Epic',
          'goblin pet': 'Common', 
          'knight companion': 'Legendary'
        };

        // Pet rarity colors
        const petRarityColors = {
          'Common': 0x808080, // Gray
          'Uncommon': 0x00FF00, // Green
          'Rare': 0x0080FF, // Blue
          'Epic': 0x8000FF, // Purple
          'Legendary': 0xFFD700 // Gold
        };

        if (equippedPet) {
          const petStatBonus = petStats[equippedPet] || {};
          const rarity = petRarity[equippedPet] || 'Common';
          const rarityColor = petRarityColors[rarity];
          const petEmote = getItemEmote(equippedPet);
          const description = petDescriptions[equippedPet] || 'A mysterious companion with unknown origins.';

          // Create Pokémon card style embed
          const petCardEmbed = {
            color: rarityColor,
            title: `🌟 **${equippedPet.toUpperCase()}** ⭐`,
            description: `*"${description}"*`,
            thumbnail: {
              url: equippedPet === 'bunny pet' 
                ? 'https://cdn.discordapp.com/emojis/1402000280790499449.webp?size=256&quality=lossless'
                : equippedPet === 'goblin pet'
                ? 'https://cdn.discordapp.com/emojis/1401989695348670524.webp?size=256&quality=lossless'
                : equippedPet === 'knight companion'
                ? 'https://cdn.discordapp.com/emojis/1402008551500546170.webp?size=256&quality=lossless'
                : null // Don't show thumbnail for pets without custom emotes
            },

            fields: [
              {
                name: '🏷️ **Rarity**',
                value: `⭐ **${rarity}**`,
                inline: true,
              },
              {
                name: '👤 **Trainer**',
                value: `**${user.username}**`,
                inline: true,
              },
              {
                name: '📊 **Stats**',
                value: Object.keys(petStatBonus).length > 0 
                  ? Object.entries(petStatBonus).map(([stat, value]) => {
                      const statEmojis = { luck: '🍀', attack: '⚔️', defense: '🛡️', health: '❤️', speed: '⚡' };
                      return `${statEmojis[stat] || '📊'} **${stat.charAt(0).toUpperCase() + stat.slice(1)}:** +${value}`;
                    }).join('\n')
                  : 'No stat bonuses',
                inline: false,
              }
            ],
            footer: {
              text: `🎭 Equipped Pet | Use "/equip pet <name>" to change pets`,
              icon_url: equippedPet === 'bunny pet' 
                ? 'https://cdn.discordapp.com/emojis/1402000280790499449.webp?size=128&quality=lossless'
                : equippedPet === 'goblin pet'
                ? 'https://cdn.discordapp.com/emojis/1401989695348670524.webp?size=128&quality=lossless'
                : equippedPet === 'knight companion'
                ? 'https://cdn.discordapp.com/emojis/1402008551500546170.webp?size=128&quality=lossless'
                : null // Don't show icon for pets without custom emotes
            },
            timestamp: new Date().toISOString()
          };

          // Add pet collection info
          if (petEntries.length > 0) {
            const petList = petEntries.map(([pet, quantity]) => {
              const equipped = equippedPet === pet ? ' ⚡ **[EQUIPPED]**' : '';
              const petEmote = getItemEmote(pet);
              return `${petEmote} **${pet}** x${quantity}${equipped}`;
            }).join('\n');
            
            petCardEmbed.fields.push({
              name: '🐾 **Pet Collection**',
              value: petList,
              inline: false,
            });
          }

          await interaction.reply({ embeds: [petCardEmbed] });
        } else {
          // No pet equipped - show collection or empty state
          const noPetEmbed = {
            color: 0xFF69B4,
            title: '🐾 **Pet Collection**',
            description: 'You don\'t have any pets equipped yet.',
            thumbnail: {
              url: user.displayAvatarURL({ dynamic: true, size: 256 })
            },
            fields: []
          };

          if (petEntries.length > 0) {
            const petList = petEntries.map(([pet, quantity]) => {
              const petEmote = getItemEmote(pet);
              return `${petEmote} **${pet}** x${quantity}`;
            }).join('\n');
            
            noPetEmbed.fields.push({
              name: '🐾 **Available Pets**',
              value: petList,
              inline: false,
            });
            
            noPetEmbed.description = 'You have pets but none are equipped. Use `/equip pet <name>` to equip one!';
          } else {
            noPetEmbed.description = 'You don\'t have any pets yet. Find them in dungeons!';
            noPetEmbed.fields.push({
              name: '💡 **How to Get Pets**',
              value: '• Defeat enemies in dungeons\n• Complete special challenges\n• Participate in events\n• Trade with other players',
              inline: false,
            });
          }

          noPetEmbed.footer = {
            text: '🐾 Start your pet collection today!',
            icon_url: null // Don't show icon for generic message
          };

          await interaction.reply({ embeds: [noPetEmbed] });
        }
        break;

      case 'dungeon':
        console.log('🏰 Dungeon command triggered by user:', user.username);
        
        const userMana = getUserMana(user.id);
        
        const dungeonEmbed = {
          color: 0x2C1810, // Dark brown for dungeon theme
          title: '🏰 **The Ancient Dungeon**',
          description: `*The air is thick with anticipation, ${user.username}... Choose your fate wisely, brave warrior.*\n\n🔮 **Your Mana:** ${userMana}/100`,
          thumbnail: {
            url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          fields: [
            {
              name: '👹 **The Goblin** ⚔️ Level 1',
              value: `🎯 **Challenge:** Easy\n💰 **Entry Cost:** 10 Panda Coins\n🔮 **Mana Cost:** 10\n❤️ **Health:** 5 HP\n⚔️ **Damage:** 1-2\n🎁 **Rewards:** 13 coins + goblin gear & pets\n\n*"A mischievous creature lurking in the shadows..."*`,
              inline: true,
            },
            {
              name: '⚔️ **The Knight** 🛡️ Level 2',
              value: `🎯 **Challenge:** Hard\n💰 **Entry Cost:** 30 Panda Coins\n🔮 **Mana Cost:** 20\n❤️ **Health:** 12 HP\n⚔️ **Damage:** 2-4\n🎁 **Rewards:** 40 coins + powerful equipment\n\n*"A formidable warrior in rusted armor..."*`,
              inline: true,
            },
            {
              name: '👹 **The Orc** ⚔️ Level 3',
              value: `🎯 **Challenge:** Brutal\n💰 **Entry Cost:** 50 Panda Coins\n🔮 **Mana Cost:** 30\n❤️ **Health:** 28 HP\n⚔️ **Damage:** 4-8\n🎁 **Rewards:** 70 coins + steel equipment\n\n*"A massive orc warrior with devastating power..."*`,
              inline: true,
            },
            {
              name: '💎 **Knight\'s Treasure Trove**',
              value: `⚔️ **50%** Broken Blade OR **15%** Knight's Rusty Blade\n🛡️ **20%** Knight's Rusty Armor\n⛑️ **10%** Knight's Rusty Helmet\n💎 **4%** Knight's Jewel\n🐴 **0.45%** Knight Companion ⭐ **LEGENDARY**`,
              inline: false,
            },
            {
              name: '🛡️ **Orc\'s Steel Arsenal**',
              value: `👁️ **50%** Orc's Eyeball (sells for 10 coins)\n🛡️ **20%** Fortified Steel Armor\n⛑️ **15%** Fortified Steel Helmet\n⚔️ **10%** Fortified Steel Waraxe\n💎 **4.5%** Orc's Hidden Jewel (sells for 25 coins)\n🐗 **0.5%** Orc Mount ⭐ **MYTHICAL**`,
              inline: false,
            },
            {
              name: '⚔️ **Combat Mechanics**',
              value: `🔄 **Turn-based combat** with strategic depth\n🛡️ **Defense** reduces damage (diminishing returns)\n🍀 **Luck** increases enemy miss chance\n⚡ **Speed** provides dodge chance\n💥 **Critical hits** for both you and enemies!`,
              inline: false,
            },
          ],
          footer: {
            text: '⚔️ Choose your opponent wisely, brave adventurer! 🛡️',
            icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          timestamp: new Date().toISOString()
        };

        const dungeonRow = {
          type: 1,
          components: [
            {
              type: 2,
              style: 3, // Success style (green) for goblin
              label: '⚔️ Fight The Goblin',
              custom_id: 'fight_goblin',
              emoji: { name: '👹' },
            },
            {
              type: 2,
              style: 1, // Primary style (blue) for knight
              label: '⚔️ Fight The Knight',
              custom_id: 'fight_knight',
              emoji: { name: '⚔️' },
            },
            {
              type: 2,
              style: 4, // Danger style (red) for orc
              label: '⚔️ Fight The Orc',
              custom_id: 'fight_orc',
              emoji: { name: '👹' },
            },
          ],
        };

        await interaction.reply({ embeds: [dungeonEmbed], components: [dungeonRow] });
        console.log('✅ Dungeon command completed successfully');
        break;



      case 'grant':
        // Check if user has administrator permission
        if (!member.permissions.has('Administrator')) {
          return await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
        }

        const grantTargetUser = interaction.options.getUser('user');
        const grantRole = interaction.options.getRole('role');
        const grantTargetMember = await guild.members.fetch(grantTargetUser.id);

        if (!grantTargetMember) {
          return await interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        // Check if bot can assign this role
        if (grantRole.position >= guild.members.me.roles.highest.position) {
          return await interaction.reply({ content: '❌ I cannot assign this role as it\'s higher than or equal to my highest role!', ephemeral: true });
        }

        // Check if user already has the role
        if (grantTargetMember.roles.cache.has(grantRole.id)) {
          return await interaction.reply({ content: `❌ ${grantTargetUser.username} already has the **${grantRole.name}** role!`, ephemeral: true });
        }

        try {
          await grantTargetMember.roles.add(grantRole, `Role granted by ${user.tag}`);

          // Send DM to the user who received the role
          try {
            await grantTargetUser.send(`🎉 You have been granted the **${grantRole.name}** role in ${guild.name} by ${user.tag}!`);
          } catch (dmError) {
            console.log('Could not send DM to user (DMs may be disabled)');
          }

          // Reply to the interaction first
          await interaction.reply(`✅ Successfully granted the **${grantRole.name}** role to ${grantTargetUser.username}!`);

          // Create varied announcement messages
          const announcements = [
            `🎉 **${user.username}** just granted **${grantTargetUser.username}** the **${grantRole.name}** role!`,
            `✨ Role update! **${grantTargetUser.username}** has been granted **${grantRole.name}** by **${user.username}**!`,
            `🎭 **${user.username}** bestowed the **${grantRole.name}** role upon **${grantTargetUser.username}**!`,
            `🏆 **${grantTargetUser.username}** just received the **${grantRole.name}** role from **${user.username}**!`,
            `⭐ New role assignment! **${user.username}** granted **${grantTargetUser.username}** the **${grantRole.name}** role!`,
            `🎊 **${grantTargetUser.username}** has been blessed with the **${grantRole.name}** role by **${user.username}**!`
          ];

          const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];

          // Send public announcement in the channel
          await interaction.followUp(randomAnnouncement);
        } catch (error) {
          console.error('Error granting role:', error);
          await interaction.reply({ content: '❌ Failed to grant the role. Please check my permissions and try again.', ephemeral: true });
        }
        break;

      case 'pandaboard':
        // Defer the reply to prevent timeout
        await interaction.deferReply();

        const boardType = interaction.options.getString('type');
        const boardScope = interaction.options.getString('scope');

        let eligibleUsers = [];

        if (boardScope === 'server') {
          // Only get users who have panda coin data and check if they're in the server
          const allUsers = Object.keys(pandaCoinData);

          for (const userId of allUsers) {
            try {
              // Check if user is in the server without fetching all members
              await guild.members.fetch(userId);
              eligibleUsers.push(userId);
            } catch {
              // User is not in the server, skip them
              continue;
            }
          }
        } else {
          // Global - all users with data
          eligibleUsers = Object.keys(pandaCoinData);
        }

        if (eligibleUsers.length === 0) {
          await interaction.editReply({ content: `❌ No data found for ${boardScope === 'server' ? 'this server' : 'global'} leaderboard!` });
          break;
        }

        let leaderboardData = [];

        if (boardType === 'coins') {
          // Panda Coins leaderboard
          leaderboardData = eligibleUsers.map(userId => ({
            userId,
            value: getUserCoins(userId),
            displayValue: `${getUserCoins(userId)} 🐼`
          })).sort((a, b) => b.value - a.value);
        } else {
          // Power leaderboard
          leaderboardData = eligibleUsers.map(userId => {
            const stats = getUserStats(userId);
            const power = stats.attack + stats.defense + stats.health + stats.luck + stats.speed;
            return {
              userId,
              value: power,
              displayValue: `${power} ⚡`
            };
          }).sort((a, b) => b.value - a.value);
        }

        // Take top 10
        const top10 = leaderboardData.slice(0, 10);

        // Build leaderboard display
        let leaderboardDisplay = '';
        const medals = ['🥇', '🥈', '🥉'];

        for (let i = 0; i < top10.length; i++) {
          const entry = top10[i];
          const medal = i < 3 ? medals[i] : `**${i + 1}.**`;

          try {
            let username;
            if (boardScope === 'server') {
              try {
                const member = await guild.members.fetch(entry.userId);
                username = member.displayName || member.user.username;
              } catch {
                username = 'Unknown User';
              }
            } else {
              // For global, try to get user from Discord
              try {
                const user = await client.users.fetch(entry.userId);
                username = user.username;
              } catch {
                username = 'Unknown User';
              }
            }

            leaderboardDisplay += `${medal} **${username}** - ${entry.displayValue}\n`;
          } catch {
            leaderboardDisplay += `${medal} **Unknown User** - ${entry.displayValue}\n`;
          }
        }

        const boardTitle = boardType === 'coins' ? 'Panda Coins' : 'Power';
        const scopeTitle = boardScope === 'server' ? guild.name : 'Global';

        const leaderboardEmbed = {
          color: boardType === 'coins' ? 0xFFD700 : 0xFF6B35,
          title: `🏆 ${boardTitle} Leaderboard - ${scopeTitle}`,
          description: leaderboardDisplay || 'No data available',
          fields: boardType === 'power' ? [
            {
              name: '⚡ Power Calculation',
              value: 'Power = Attack + Defense + Health + Luck + Speed',
              inline: false,
            },
          ] : [],
          footer: {
            text: `Showing top ${Math.min(10, top10.length)} ${boardScope === 'server' ? 'server members' : 'players'}`,
          },
          timestamp: new Date().toISOString(),
        };

        await interaction.editReply({ embeds: [leaderboardEmbed] });
        break;

      case 'setsuggestion':
        // Check if user has administrator permission
        if (!member.permissions.has('Administrator')) {
          return await interaction.reply({ content: '❌ You need Administrator permissions to set the suggestions channel!', ephemeral: true });
        }

        const suggestionChannel = interaction.options.getChannel('channel');

        // Check if the channel is a text channel
        if (suggestionChannel.type !== 0) { // 0 = GUILD_TEXT
          return await interaction.reply({ content: '❌ Please select a text channel for suggestions!', ephemeral: true });
        }

        // Check if bot can send messages in the channel
        const botPermissions = suggestionChannel.permissionsFor(guild.members.me);
        if (!botPermissions.has('SendMessages') || !botPermissions.has('AddReactions')) {
          return await interaction.reply({ content: '❌ I need permissions to send messages and add reactions in that channel!', ephemeral: true });
        }

        // Set the suggestion channel for this guild
        suggestionChannels[guild.id] = suggestionChannel.id;
        saveSuggestionChannels();

        // Send informative embed to the suggestions channel
        const welcomeEmbed = {
          color: 0x0099FF,
          title: '💡 Welcome to the Suggestions Channel!',
          description: 'This channel has been set up for server suggestions. Here\'s how it works:',
          fields: [
            {
              name: '📝 How to Submit Suggestions',
              value: '• Use `/suggestion <your idea>` anywhere in the server\n• Your suggestion will automatically appear here\n• Community members can react with ✅ or ❌ to vote',
              inline: false,
            },
            {
              name: '👑 Admin Features',
              value: '• `/addsuggestion <message_id>` - Add any message as a suggestion\n• `/suggestioncomplete` - Mark suggestions as completed\n• `/suggestiondeny` - Mark suggestions as denied\n• React or reply to suggestions to interact with the community',
              inline: false,
            },
            {
              name: '🎯 Guidelines',
              value: '• Keep suggestions constructive and relevant\n• Be respectful in your feedback\n• Duplicate suggestions may be removed\n• Admins will review and respond to suggestions regularly',
              inline: false,
            },
          ],
          footer: {
            text: 'Ready to receive suggestions! Use /suggestion to get started.',
          },
          timestamp: new Date().toISOString(),
        };

        try {
          await suggestionChannel.send({ embeds: [welcomeEmbed] });
        } catch (error) {
          console.error('Error sending welcome message to suggestions channel:', error);
        }

        await interaction.reply(`✅ Suggestions channel set to ${suggestionChannel}! A welcome message has been posted with instructions for users.`);
        break;

      case 'suggestion':
        const suggestionText = interaction.options.getString('text');
        const guildSuggestionChannelId = suggestionChannels[guild.id];

        if (!guildSuggestionChannelId) {
          return await interaction.reply({ content: '❌ No suggestions channel has been set for this server! Ask an admin to use `/setsuggestion` first.', ephemeral: true });
        }

        const suggestionChannelObj = guild.channels.cache.get(guildSuggestionChannelId);
        if (!suggestionChannelObj) {
          return await interaction.reply({ content: '❌ The suggestions channel no longer exists! Ask an admin to set a new one with `/setsuggestion`.', ephemeral: true });
        }

        // Create suggestion embed
        const suggestionEmbed = {
          color: 0x0099FF,
          title: '💡 New Suggestion',
          description: suggestionText,
          author: {
            name: user.username,
            icon_url: user.displayAvatarURL(),
          },
          footer: {
            text: 'React with ✅ to approve or ❌ to deny | Use /suggestioncomplete or /suggestiondeny to mark status',
          },
          timestamp: new Date().toISOString(),
        };

        try {
          const suggestionMessage = await suggestionChannelObj.send({ embeds: [suggestionEmbed] });
          await suggestionMessage.react('✅');
          await suggestionMessage.react('❌');

          await interaction.reply({ content: `✅ Your suggestion has been posted in ${suggestionChannelObj}!`, ephemeral: true });
        } catch (error) {
          console.error('Error posting suggestion:', error);
          await interaction.reply({ content: '❌ Failed to post suggestion. Please check my permissions in the suggestions channel.', ephemeral: true });
        }
        break;

      case 'addsuggestion':
        // Check if user has administrator permission
        if (!member.permissions.has('Administrator')) {
          return await interaction.reply({ content: '❌ You need Administrator permissions to add suggestions!', ephemeral: true });
        }

        const guildSuggestionChannelIdAdd = suggestionChannels[guild.id];
        if (!guildSuggestionChannelIdAdd) {
          return await interaction.reply({ content: '❌ No suggestions channel has been set for this server! Use `/setsuggestion` first.', ephemeral: true });
        }

        const suggestionChannelObjAdd = guild.channels.cache.get(guildSuggestionChannelIdAdd);
        if (!suggestionChannelObjAdd) {
          return await interaction.reply({ content: '❌ The suggestions channel no longer exists! Set a new one with `/setsuggestion`.', ephemeral: true });
        }

        const messageId = interaction.options.getString('message_id');

        try {
          const referencedMessage = await interaction.channel.messages.fetch(messageId);

          if (!referencedMessage) {
            return await interaction.reply({ content: '❌ Could not find the message with that ID!', ephemeral: true });
          }

        // Create suggestion embed from the referenced message
        const addSuggestionEmbed = {
          color: 0x0099FF,
          title: '💡 Admin-Added Suggestion',
          description: referencedMessage.content || 'No text content',
          author: {
            name: referencedMessage.author.username,
            icon_url: referencedMessage.author.displayAvatarURL(),
          },
          footer: {
            text: `Added by ${user.username} | React with ✅ to approve or ❌ to deny`,
          },
          timestamp: new Date().toISOString(),
        };

        try {
            const addedSuggestionMessage = await suggestionChannelObjAdd.send({ embeds: [addSuggestionEmbed] });
            await addedSuggestionMessage.react('✅');
            await addedSuggestionMessage.react('❌');

            await interaction.reply({ content: `✅ Message added as suggestion in ${suggestionChannelObjAdd}!`, ephemeral: true });
          } catch (error) {
            console.error('Error adding suggestion:', error);
            await interaction.reply({ content: '❌ Failed to add suggestion. Please check my permissions in the suggestions channel.', ephemeral: true });
          }
        } catch (error) {
          console.error('Error fetching message:', error);
          await interaction.reply({ content: '❌ Could not find the message with that ID. Make sure you copied the correct message ID and that the message is in this channel.', ephemeral: true });
        }
        break;

      case 'suggestioncomplete':
        // Check if user has administrator permission
        if (!member.permissions.has('Administrator')) {
          return await interaction.reply({ content: '❌ You need Administrator permissions to mark suggestions as complete!', ephemeral: true });
        }

        const guildSuggestionChannelIdComplete = suggestionChannels[guild.id];
        if (!guildSuggestionChannelIdComplete) {
          return await interaction.reply({ content: '❌ No suggestions channel has been set for this server!', ephemeral: true });
        }

        const suggestionChannelObjComplete = guild.channels.cache.get(guildSuggestionChannelIdComplete);
        if (!suggestionChannelObjComplete) {
          return await interaction.reply({ content: '❌ The suggestions channel no longer exists!', ephemeral: true });
        }

        const completeMessageId = interaction.options.getString('message_id');

        try {
          const completedMessage = await suggestionChannelObjComplete.messages.fetch(completeMessageId);

          if (!completedMessage || !completedMessage.embeds[0]) {
            return await interaction.reply({ content: '❌ Could not find a suggestion message with that ID!', ephemeral: true });
          }

          // Update the embed to show completion
          const completedEmbed = { ...completedMessage.embeds[0] };
          completedEmbed.color = 0x00FF00; // Green
          completedEmbed.title = '✅ Completed Suggestion';
          completedEmbed.footer = {
            text: `Marked as completed by ${user.username}`,
          };

          await completedMessage.edit({ embeds: [completedEmbed] });

          // Show what suggestion was marked as complete
          const suggestionText = completedEmbed.description || 'No text content';
          const truncatedText = suggestionText.length > 100 ? suggestionText.substring(0, 100) + '...' : suggestionText;

          await interaction.reply({ 
            content: `✅ **Suggestion marked as completed!**\n\n**Suggestion:** "${truncatedText}"`, 
            ephemeral: true 
          });
        } catch (error) {
          console.error('Error marking suggestion as complete:', error);
          await interaction.reply({ content: '❌ Could not find the suggestion message with that ID. Make sure you copied the correct message ID from the suggestions channel.', ephemeral: true });
        }
        break;

      case 'suggestiondeny':
        // Check if user has administrator permission
        if (!member.permissions.has('Administrator')) {
          return await interaction.reply({ content: '❌ You need Administrator permissions to deny suggestions!', ephemeral: true });
        }

        const guildSuggestionChannelIdDeny = suggestionChannels[guild.id];
        if (!guildSuggestionChannelIdDeny) {
          return await interaction.reply({ content: '❌ No suggestions channel has been set for this server!', ephemeral: true });
        }

        const suggestionChannelObjDeny = guild.channels.cache.get(guildSuggestionChannelIdDeny);
        if (!suggestionChannelObjDeny) {
          return await interaction.reply({ content: '❌ The suggestions channel no longer exists!', ephemeral: true });
        }

        const denyMessageId = interaction.options.getString('message_id');

        try {
          const deniedMessage = await suggestionChannelObjDeny.messages.fetch(denyMessageId);

          if (!deniedMessage || !deniedMessage.embeds[0]) {
            return await interaction.reply({ content: '❌ Could not find a suggestion message with that ID!', ephemeral: true });
          }

          // Update the embed to show denial
          const deniedEmbed = { ...deniedMessage.embeds[0] };
          deniedEmbed.color = 0xFF0000; // Red
          deniedEmbed.title = '❌ Denied Suggestion';
          deniedEmbed.footer = {
            text: `Marked as denied by ${user.username}`,
          };

          await deniedMessage.edit({ embeds: [deniedEmbed] });

          // Show what suggestion was marked as denied
          const suggestionText = deniedEmbed.description || 'No text content';
          const truncatedText = suggestionText.length > 100 ? suggestionText.substring(0, 100) + '...' : suggestionText;

          await interaction.reply({ 
            content: `❌ **Suggestion marked as denied!**\n\n**Suggestion:** "${truncatedText}"`, 
            ephemeral: true 
          });
        } catch (error) {
          console.error('Error marking suggestion as denied:', error);
          await interaction.reply({ content: '❌ Could not find the suggestion message with that ID. Make sure you copied the correct message ID from the suggestions channel.', ephemeral: true });
        }
        break;

      case 'inspect':
        const inspectItemName = interaction.options.getString('item').toLowerCase();
        const itemInfo = itemDatabase[inspectItemName];

        if (!itemInfo) {
          // Create a list of available items for reference
          const availableItems = Object.keys(itemDatabase).join(', ');
          await interaction.reply({ 
            content: `❌ Item "${inspectItemName}" not found!\n\n**Available items to inspect:**\n${availableItems}`, 
            ephemeral: true 
          });
          break;
        }

        // Create stats display
        let inspectStatsDisplay = '';
        if (Object.keys(itemInfo.stats).length > 0) {
          const statEntries = Object.entries(itemInfo.stats);
          inspectStatsDisplay = statEntries.map(([stat, value]) => {
            const statEmojis = {
              attack: '⚔️',
              defense: '🛡️',
              health: '❤️',
              speed: '⚡',
              luck: '🍀'
            };
            return `${statEmojis[stat] || '📊'} **${stat.charAt(0).toUpperCase() + stat.slice(1)}:** +${value}`;
          }).join('\n');
        } else {
          inspectStatsDisplay = 'No stat bonuses';
        }

        // Determine rarity color
        const rarityColors = {
          'very common': 0x808080,    // Gray
          'common': 0x00FF00,         // Green  
          'uncommon': 0x0099FF,       // Blue
          'rare': 0x9900FF,           // Purple
          'extremely rare': 0xFFD700, // Gold
          'mythical': 0xFFD700        // Shiny Gold for mythical items
        };

        const inspectEmbed = {
          color: rarityColors[itemInfo.rarity] || 0x0099FF,
          title: `${inspectItemName.charAt(0).toUpperCase() + inspectItemName.slice(1)}`,
          description: itemInfo.description,
          thumbnail: {
            url: inspectItemName === 'bunny pet' 
              ? 'https://cdn.discordapp.com/emojis/1402000280790499449.webp?size=96&quality=lossless'
              : inspectItemName === 'goblin pet'
              ? 'https://cdn.discordapp.com/emojis/1401989695348670524.webp?size=96&quality=lossless'
              : inspectItemName === 'knight companion'
              ? 'https://cdn.discordapp.com/emojis/1402008551500546170.webp?size=96&quality=lossless'
              : inspectItemName === 'shiny reindeer antlers'
              ? 'https://cdn.discordapp.com/emojis/1402014761499230398.webp?size=96&quality=lossless'
              : null // Don't show thumbnail for items without custom emotes
          },
          fields: [
            {
              name: '📊 Stats',
              value: inspectStatsDisplay,
              inline: true,
            },
            {
              name: '🎯 Uses',
              value: itemInfo.uses,
              inline: false,
            },
            {
              name: '📍 How to Obtain',
              value: itemInfo.obtainedFrom,
              inline: false,
            },
            {
              name: '⭐ Rarity',
              value: itemInfo.rarity.charAt(0).toUpperCase() + itemInfo.rarity.slice(1),
              inline: true,
            },
            {
              name: '📦 Category',
              value: itemInfo.category.charAt(0).toUpperCase() + itemInfo.category.slice(1),
              inline: true,
            },
          ],
          footer: {
            text: 'Use /inventory to check if you own this item',
          },
        };

        await interaction.reply({ embeds: [inspectEmbed] });
        break;

      case 'inspectplayer':
        const inspectTargetUser = interaction.options.getString('user');
        
        // Try to find the user by mention, ID, or username
        let inspectTargetUserId = null;
        
        // Check if it's a mention
        const inspectMentionMatch = inspectTargetUser.match(/<@!?(\d+)>/);
        if (inspectMentionMatch) {
          inspectTargetUserId = inspectMentionMatch[1];
        } else {
          // Check if it's a user ID
          if (/^\d+$/.test(inspectTargetUser)) {
            inspectTargetUserId = inspectTargetUser;
          } else {
            // Try to find by username
            const guild = interaction.guild;
            if (guild) {
              const member = guild.members.cache.find(m => 
                m.user.username.toLowerCase() === inspectTargetUser.toLowerCase() ||
                m.displayName.toLowerCase() === inspectTargetUser.toLowerCase()
              );
              if (member) {
                inspectTargetUserId = member.user.id;
              }
            }
          }
        }

        if (!inspectTargetUserId) {
          await interaction.reply({ 
            content: '❌ Player not found! Please use a valid mention, user ID, or username.', 
            ephemeral: true 
          });
          break;
        }

        // Get player data
        const inspectPlayerStats = getUserStats(inspectTargetUserId);
        const inspectPlayerCoins = getUserCoins(inspectTargetUserId);
        const inspectEquippedGear = getUserEquipped(inspectTargetUserId);
        const inspectEquippedPet = getUserEquippedPet(inspectTargetUserId);

        // Calculate total power
        const inspectTotalPower = inspectPlayerStats.attack + inspectPlayerStats.defense + inspectPlayerStats.health + inspectPlayerStats.speed + inspectPlayerStats.luck;

        // Create equipment display
        const inspectEquipmentDisplay = [];
        if (inspectEquippedGear.weapon) inspectEquipmentDisplay.push(`🗡️ **Weapon:** ${inspectEquippedGear.weapon}`);
        if (inspectEquippedGear.helmet) inspectEquipmentDisplay.push(`⛑️ **Helmet:** ${inspectEquippedGear.helmet}`);
        if (inspectEquippedGear.armor) inspectEquipmentDisplay.push(`🛡️ **Armor:** ${inspectEquippedGear.armor}`);
        if (inspectEquippedGear.ride) inspectEquipmentDisplay.push(`🐎 **Ride:** ${inspectEquippedGear.ride}`);
        if (inspectEquippedPet) inspectEquipmentDisplay.push(`🐾 **Pet:** ${inspectEquippedPet}`);

        const inspectEquipmentText = inspectEquipmentDisplay.length > 0 ? inspectEquipmentDisplay.join('\n') : '🎭 *No equipment equipped*';

        // Get user info
        let inspectTargetUsername = 'Unknown Player';
        try {
          const inspectTargetUserObj = await client.users.fetch(inspectTargetUserId);
          inspectTargetUsername = inspectTargetUserObj.username;
        } catch (error) {
          console.log('Could not fetch user info:', error.message);
        }

        const inspectPlayerEmbed = {
          color: 0x8B4513, // Saddle brown
          title: `🔍 **Player Inspection: ${inspectTargetUsername}**`,
          description: '**"A detailed analysis of this warrior\'s capabilities and equipment."**',
          thumbnail: {
            url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          fields: [
            {
              name: '💰 **Panda Coins**',
              value: `${inspectPlayerCoins} 🐼`,
              inline: true,
            },
            {
              name: '⚔️ **Total Power**',
              value: `${inspectTotalPower} ⚡`,
              inline: true,
            },
            {
              name: '📊 **Individual Stats**',
              value: `⚔️ **Attack:** ${inspectPlayerStats.attack}\n🛡️ **Defense:** ${inspectPlayerStats.defense}\n❤️ **Health:** ${inspectPlayerStats.health}\n⚡ **Speed:** ${inspectPlayerStats.speed}\n🍀 **Luck:** ${inspectPlayerStats.luck}`,
              inline: false,
            },
            {
              name: '🎯 **Equipped Gear**',
              value: inspectEquipmentText,
              inline: false,
            },
          ],
          footer: {
            text: 'Use this information to help optimize gear for boss fights!',
            icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          timestamp: new Date().toISOString()
        };

        await interaction.reply({ embeds: [inspectPlayerEmbed] });
        break;

      case 'use':
        const itemToUse = interaction.options.getString('item');
        const useUserInventory = getUserInventory(user.id);
        
        // Check if user has the item
        if (!useUserInventory[itemToUse] || useUserInventory[itemToUse] <= 0) {
          await interaction.reply({ 
            content: `❌ You don't have any **${itemToUse}** to use!`, 
            ephemeral: true 
          });
          break;
        }
        
        // Handle different consumable items
        if (itemToUse === 'small mana potion') {
          const currentMana = getUserMana(user.id);
          const manaRestore = Math.min(20, 100 - currentMana);
          
          if (manaRestore <= 0) {
            await interaction.reply({ 
              content: '🔮 Your mana is already full! You don\'t need to use a mana potion.', 
              ephemeral: true 
            });
            break;
          }
          
          // Remove the potion and restore mana
          if (removeItemFromInventory(user.id, 'small mana potion', 1)) {
            addMana(user.id, manaRestore);
            
            const useEmbed = {
              color: 0x9932CC,
              title: '🔮 Mana Potion Used!',
              description: '**"The magical essence flows through you, restoring your mana!"**',
              fields: [
                {
                  name: '🔮 Mana Restored',
                  value: `+${manaRestore} mana`,
                  inline: true,
                },
                {
                  name: '🎯 New Mana Total',
                  value: `${currentMana + manaRestore}/100`,
                  inline: true,
                },
                {
                  name: '📦 Remaining Potions',
                  value: `${useUserInventory[itemToUse] - 1}x Small Mana Potion`,
                  inline: false,
                },
              ],
              footer: {
                text: 'Use your restored mana to fight more enemies in the dungeon!',
              },
            };
            
            await interaction.reply({ embeds: [useEmbed] });
          } else {
            await interaction.reply({ 
              content: '❌ Failed to use the mana potion. Please try again.', 
              ephemeral: true 
            });
          }
        } else if (itemToUse === 'small potion') {
          await interaction.reply({ 
            content: '🧪 Small Potions can only be used during battle! Use them when fighting enemies.', 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: `❌ **${itemToUse}** is not a consumable item that can be used outside of battle.`, 
            ephemeral: true 
          });
        }
        break;

      case 'quest':
        console.log('🎯 QUEST CASE REACHED!');
        console.log('🎯 Command name in case:', commandName);
        console.log('🎯 Command name === "quest":', commandName === 'quest');
        console.log('🎯 ABOUT TO REPLY!');
        const questMode = interaction.options.getString('mode');
        console.log('🎯 Quest mode:', questMode);
        
        if (questMode === 'story') {
          const questUserData = getUserQuestData(user.id);
          console.log('🎯 Quest user data:', questUserData);
          
          // Check which quest the user is on
          const digCompleted = questUserData.completedQuests?.dig10;
          const powerCompleted = questUserData.completedQuests?.power10;
          const power25Completed = questUserData.completedQuests?.power25;
          const goblinCompleted = questUserData.completedQuests?.goblinDefeat;
          const huntCompleted = questUserData.completedQuests?.hunt20;
          const orcCompleted = questUserData.completedQuests?.orcDefeat;
          
          let questEmbed;
          let questButtons = [];
          
          // Check for unclaimed quests FIRST (highest priority)
          if (digCompleted && !digCompleted.claimed) {
            // Dig quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Dig Apprentice**',
              description: 'You\'ve completed the dig quest! Claim your reward!',
              fields: [
                {
                  name: '🔨 Dig Apprentice Quest',
                  value: `**Progress:** 10/10 digs completed\n**Reward:** 25 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_dig10'
            });
          }
          else if (powerCompleted && !powerCompleted.claimed) {
            // Power quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Dungeon Preparation**',
              description: 'You\'ve completed the power quest! Claim your reward!',
              fields: [
                {
                  name: '⚔️ Dungeon Preparation Quest',
                  value: `**Progress:** 10/10 total power achieved\n**Reward:** 50 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_power10'
            });
          }
          else if (goblinCompleted && !goblinCompleted.claimed) {
            // Goblin quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Goblin Slayer**',
              description: 'You\'ve completed the goblin quest! Claim your reward!',
              fields: [
                {
                  name: '👹 Goblin Slayer Quest',
                  value: `**Progress:** 1/1 goblin defeated\n**Reward:** 75 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_goblinDefeat'
            });
          }
          else if (huntCompleted && !huntCompleted.claimed) {
            // Hunt quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Master Hunter**',
              description: 'You\'ve completed the hunt quest! Claim your reward!',
              fields: [
                {
                  name: '🏹 Master Hunter Quest',
                  value: `**Progress:** 20/20 hunts completed\n**Reward:** 100 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_hunt20'
            });
          }
          else if (power25Completed && !power25Completed.claimed) {
            // Power25 quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Legendary Warrior**',
              description: 'You\'ve completed the Legendary Warrior quest! Claim your reward!',
              fields: [
                {
                  name: '⚔️ Legendary Warrior Quest',
                  value: `**Progress:** 25/25 total power achieved\n**Reward:** 125 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_power25'
            });
          }
          else if (orcCompleted && !orcCompleted.claimed) {
            // Orc quest completed but not claimed
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Orc Slayer**',
              description: 'You\'ve completed the Orc Slayer quest! Claim your reward!',
              fields: [
                {
                  name: '👹 Orc Slayer Quest',
                  value: `**Progress:** 1/1 orc defeated\n**Reward:** 150 Panda Coins\n**Status:** ✅ Completed\n**💡 Hint:** Click the button below to claim your reward!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Claim your reward to complete the story!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            questButtons.push({
              type: 2,
              style: 3,
              label: '🎁 CLAIM REWARD',
              custom_id: 'claim_quest_orcDefeat'
            });
          }
          // Quest 1: Dig 10 times (if no unclaimed quests)
          else if (!digCompleted) {
            const digProgress = questUserData.digCount || 0;
            const isCompleted = digProgress >= 10;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Dig Apprentice**',
              description: 'Begin your journey as a digger!',
              fields: [
                {
                  name: '🔨 Dig Apprentice Quest',
                  value: `**Progress:** ${digProgress}/10 digs completed\n**Reward:** 25 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Use /dig to dig for treasures!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Complete this quest to unlock the next step!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_dig10'
              });
            }
          }
          // Quest 2: Power 10 (if dig is completed)
          else if (!powerCompleted) {
            const powerProgress = questUserData.powerCount || 0;
            const isCompleted = powerProgress >= 10;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Dungeon Preparation**',
              description: 'You\'ve mastered digging! Now prepare for battle!',
              fields: [
                {
                  name: '⚔️ Dungeon Preparation Quest',
                  value: `**Progress:** ${powerProgress}/10 total power achieved\n**Reward:** 50 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Shop for weapons and armor, or dig for Old Worn Set pieces!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Achieve 10 total power to prepare for your first dungeon enemy!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_power10'
              });
            }
          }
          // Quest 3: Goblin Defeat (if power is completed)
          else if (!goblinCompleted) {
            const isCompleted = questUserData.goblinDefeated || false;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Goblin Slayer**',
              description: 'You\'ve prepared for battle! Now face your first enemy!',
              fields: [
                {
                  name: '👹 Goblin Slayer Quest',
                  value: `**Progress:** ${isCompleted ? '1/1' : '0/1'} goblin defeated\n**Reward:** 75 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Use /dungeon goblin to fight the goblin enemy!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Defeat the goblin to complete your first dungeon challenge!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_goblinDefeat'
              });
            }
          }
          // Quest 4: Hunt 20 times (if goblin is completed)
          else if (!huntCompleted) {
            const huntProgress = questUserData.huntCount || 0;
            const isCompleted = huntProgress >= 20;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Master Hunter**',
              description: 'You\'ve defeated the goblin! Now become a master hunter!',
              fields: [
                {
                  name: '🏹 Master Hunter Quest',
                  value: `**Progress:** ${huntProgress}/20 hunts completed\n**Reward:** 100 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Use /hunt to hunt for animals and treasures!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Hunt 20 times to become a master hunter!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_hunt20'
              });
                        }
          }
          // Quest 5: Power 25 (if hunt is completed)
          else if (!power25Completed) {
            const powerProgress = questUserData.powerCount || 0;
            const isCompleted = powerProgress >= 25;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Legendary Warrior**',
              description: 'You\'ve become a master hunter! Now reach legendary status!',
              fields: [
                {
                  name: '⚔️ Legendary Warrior Quest',
                  value: `**Progress:** ${powerProgress}/25 total power achieved\n**Reward:** 125 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Collect powerful gear sets like Rusty Knight (26 power) or Fortified Steel!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Achieve 25 total power to become a legendary warrior!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_power25'
              });
            }
          }
          // Quest 6: Orc Defeat (if power25 is completed)
          else if (!orcCompleted) {
            const isCompleted = questUserData.orcDefeated || false;
            
            questEmbed = {
              color: 0x8B4513,
              title: '🎯 **Story Quest - Orc Slayer**',
              description: 'You\'ve become a legendary warrior! Now face the mighty orc!',
              fields: [
                {
                  name: '👹 Orc Slayer Quest',
                  value: `**Progress:** ${isCompleted ? '1/1' : '0/1'} orc defeated\n**Reward:** 150 Panda Coins\n**Status:** ${isCompleted ? '✅ Completed' : '⏳ In Progress'}\n**💡 Hint:** Use /dungeon orc to fight The Orc Enemy!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 Defeat The Orc Enemy to become the ultimate warrior!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
            
            if (isCompleted) {
              questButtons.push({
                type: 2,
                style: 3,
                label: '🎁 CLAIM REWARD',
                custom_id: 'claim_quest_orcDefeat'
              });
            }
          }
          // All quests completed
          else {
            questEmbed = {
              color: 0x00FF00,
              title: '🏆 **Story Quests Completed!**',
              description: 'Congratulations! You\'ve completed all available story quests!',
              fields: [
                {
                  name: '✅ Completed Quests',
                  value: `**🔨 Dig Apprentice** - Completed on ${new Date(digCompleted.completedAt).toLocaleDateString()}\n**⚔️ Dungeon Preparation** - Completed on ${new Date(powerCompleted.completedAt).toLocaleDateString()}\n**👹 Goblin Slayer** - Completed on ${new Date(goblinCompleted.completedAt).toLocaleDateString()}\n**🏹 Master Hunter** - Completed on ${new Date(huntCompleted.completedAt).toLocaleDateString()}\n**⚔️ Legendary Warrior** - ${power25Completed ? `Completed on ${new Date(power25Completed.completedAt).toLocaleDateString()}` : 'Not completed yet'}\n**👹 Orc Slayer** - ${orcCompleted ? `Completed on ${new Date(orcCompleted.completedAt).toLocaleDateString()}` : 'Not completed yet'}\n\n🎉 You're a true warrior and master hunter!`,
                  inline: false
                }
              ],
              footer: {
                text: '🎯 More quests coming soon!',
                icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
              },
              timestamp: new Date().toISOString()
            };
          }
          
          const actionRow = questButtons.length > 0 ? {
            type: 1,
            components: questButtons
          } : null;
          
          await interaction.reply({
            embeds: [questEmbed],
            components: actionRow ? [actionRow] : []
          });
        }
        break;

      case 'dungeonmulti':
        console.log('🎮 Multiplayer dungeon command triggered by user:', user.username);
        
        const dungeonMultiEmbed = {
          color: 0x8B4513,
          title: '🎮 **Multiplayer Dungeon Battles**',
          description: `*Gather your friends and face powerful bosses together, ${user.username}!*\n\n💰 **Your Coins:** ${getUserCoins(user.id)} Panda Coins`,
          thumbnail: {
            url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          fields: [
            {
              name: '👹 **The Crazy Giant** ⚔️ Boss',
                                value: `🎯 **Challenge:** Multiplayer\n💰 **Entry Cost:** 75 Panda Coins + 45 Mana (Host only)\n⏰ **Join Window:** 30 seconds\n👥 **Players:** 2-4 players\n🎁 **Rewards:** 300 coins + 25 exp split among all players\n\n*"A massive giant that grows stronger when enraged..."*`,
              inline: false,
            },
            {
              name: '⚔️ **Battle Mechanics**',
                                value: `🔄 **Turn-based combat** with strategic depth\n👹 **Boss attacks all players** each round\n⚔️ **Players attack one by one**\n🛡️ **Defend** to reduce damage\n⏰ **10-second turns** with auto-attack\n🎯 **300 coin + 25 exp reward pool** for all players`,
              inline: false,
            },
          ],
          footer: {
            text: '🎮 Choose your boss and gather your team!',
            icon_url: 'https://cdn.discordapp.com/emojis/1400990115555311758.webp?size=96&quality=lossless'
          },
          timestamp: new Date().toISOString()
        };

        const dungeonMultiRow = {
          type: 1,
          components: [
            {
              type: 2,
              style: 4, // Danger style (red) for giant
              label: '⚔️ Fight The Crazy Giant',
              custom_id: 'multi_fight_crazy_giant',
              emoji: { name: '👹' },
            },
          ],
        };

        await interaction.reply({ embeds: [dungeonMultiEmbed], components: [dungeonMultiRow] });
        console.log('✅ Multiplayer dungeon command completed successfully');
        break;

      case 'merchant':
        const merchantMode = interaction.options.getString('mode');

        if (merchantMode === 'buy') {
          // Check what items are available for this player
          const availableItems = [];
          const lockedItems = [];

          Object.entries(merchantInventory).forEach(([itemName, itemData]) => {
            if (hasMerchantUnlock(user.id, itemData.unlockCondition)) {
              availableItems.push({ name: itemName, ...itemData });
            } else {
              lockedItems.push({ name: itemName, ...itemData });
            }
          });

          if (availableItems.length === 0) {
            // No items unlocked yet
            const noItemsEmbed = {
              color: 0x9932CC,
              title: '🛒 The Merchant - Buying Mode',
              description: '**"Welcome, traveler! I have rare goods for those who prove themselves worthy..."**',
              fields: [
                {
                  name: '🔒 Items Locked',
                  value: '🧪 **Small Potion** - 4 🐼\n*Defeat The Goblin to unlock this item*\n🔮 **Small Mana Potion** - 8 🐼\n*Defeat The Goblin to unlock this item*\n\nMore items will become available as you progress!',
                  inline: false,
                },
                {
                  name: '🗡️ How to Unlock',
                  value: '• Defeat enemies in the dungeon\n• Complete challenges and quests\n• Explore the world and prove your worth!',
                  inline: false,
                },
              ],
              footer: {
                text: 'Defeat The Goblin to unlock your first purchasable item!',
              },
            };

            await interaction.reply({ embeds: [noItemsEmbed] });
          } else {
            // Show available items
            const itemsDisplay = availableItems.map(item => {
              let emoji = '📦';
              if (item.name === 'small potion') emoji = '🧪';
              else if (item.name === 'small mana potion') emoji = '🔮';
              return `${emoji} **${item.name}** - ${item.price} 🐼\n*${item.description}*`;
            }).join('\n\n');

            let lockedDisplay = '';
            if (lockedItems.length > 0) {
              lockedDisplay = '\n\n🔒 **Locked Items:**\n' + lockedItems.map(item => {
                let emoji = '📦';
                if (item.name === 'small potion') emoji = '🧪';
                else if (item.name === 'small mana potion') emoji = '🔮';
                return `${emoji} **${item.name}** - ${item.price} 🐼 (Locked)`;
              }).join('\n');
            }

            const buyingEmbed = {
              color: 0x9932CC,
              title: '🛒 The Merchant - Buying Mode',
              description: '**"Ah, a worthy warrior! You\'ve proven yourself in battle. Here are my wares..."**',
              fields: [
                {
                  name: '🎁 Available Items',
                  value: itemsDisplay + lockedDisplay,
                  inline: false,
                },
                {
                  name: '💰 Your Balance',
                  value: `${getUserCoins(user.id)} Panda Coins 🐼`,
                  inline: false,
                },
              ],
              footer: {
                text: 'Click below to purchase items!',
              },
            };

            // Create buy buttons for available items
            const buyButtons = availableItems.map(item => {
              const customId = `buy_${item.name.replace(/ /g, '_')}_${user.id}`;
              console.log('🔧 Creating button for item:', item.name, 'with custom ID:', customId);
              return {
                type: 2,
                style: 3, // Success style (green)
                label: `Buy ${item.name} (${item.price} 🐼)`,
                custom_id: customId,
                emoji: { 
                  name: item.name === 'small potion' ? '🧪' : 
                        item.name === 'small mana potion' ? '🔮' : '📦' 
                },
              };
            });

            const actionRow = {
              type: 1,
              components: buyButtons.slice(0, 5), // Max 5 buttons per row
            };

            await interaction.reply({ 
              embeds: [buyingEmbed], 
              components: buyButtons.length > 0 ? [actionRow] : [] 
            });
          }
        } else {
          // Selling mode
          const userInventory = getUserInventory(user.id);
          const sellableItems = Object.entries(userInventory).filter(([item]) => merchantPrices[item]);

          if (sellableItems.length === 0) {
            const noItemsEmbed = {
              color: 0x9932CC,
              title: '🏪 The Merchant - Selling Mode',
              description: '**"Ah, you have nothing I\'m interested in buying right now..."**',
              fields: [
                {
                  name: '💰 Items I Buy',
                  value: '🦷 **Goblin Tooth** - 3 🐼\n💀 **Skull** - 2 🐼\n🧦 **Sock** - 1 🐼\n🗡️ **Broken Blade** - 5 🐼\n💎 **Knight\'s Jewel** - 10 🐼',
                  inline: false,
                },
                {
                  name: '🎯 How to Get These Items',
                  value: '• Fight enemies in the dungeon\n• Dig for treasures with shovels\n• Explore and battle for rare drops!',
                  inline: false,
                },
              ],
              footer: {
                text: 'Come back when you have items to sell!',
              },
            };

            await interaction.reply({ embeds: [noItemsEmbed] });
            break;
          }

          // Calculate total value
          let totalValue = 0;
          const itemsDisplay = sellableItems.map(([item, quantity]) => {
            const price = merchantPrices[item];
            const itemValue = price * quantity;
            totalValue += itemValue;

            const emoji = item === 'goblin tooth' ? '🦷' : 
                         item === 'skull' ? '💀' : 
                         item === 'sock' ? '🧦' : 
                         item === 'broken blade' ? '🗡️' : 
                         item === 'knight\'s jewel' ? '💎' : '📦';

            return `${emoji} **${item}** x${quantity} → ${itemValue} 🐼 (${price} each)`;
          }).join('\n');

          const sellingEmbed = {
            color: 0x9932CC,
            title: '🏪 The Merchant - Selling Mode',
            description: '**"Interesting items you have there! I\'ll give you a fair price for them."**',
            fields: [
              {
                name: '💰 Your Sellable Items',
                value: itemsDisplay,
                inline: false,
              },
              {
                name: '🎯 Total Value',
                value: `**${totalValue} Panda Coins** 🐼`,
                inline: false,
              },
            ],
            footer: {
              text: 'Click "Sell All Items" to complete the transaction',
            },
          };

          const sellButton = {
            type: 1,
            components: [
              {
                type: 2,
                style: 3, // Success style (green)
                label: `Sell All Items (${totalValue} 🐼)`,
                custom_id: `sell_all_${user.id}_${totalValue}`,
                emoji: { name: '💰' },
              },
            ],
          };

          await interaction.reply({ embeds: [sellingEmbed], components: [sellButton] });
        }
        break;

      case 'charm':
        const charmItemName = interaction.options.getString('item').toLowerCase();

        // Get player stats first
        const charmPlayerStats = getUserStats(user.id);

        // Check if user has at least 1 luck point
        if (charmPlayerStats.luck < 1) {
          return await interaction.reply({ 
            content: '❌ You need at least 1 luck point to use charm! Equip pets or gear with luck bonuses first.', 
            ephemeral: true 
          });
        }

        // Check if item exists in the database
        const charmItem = itemDatabase[charmItemName];
        if (!charmItem) {
          // Show available charmable items
          const charmableItems = Object.keys(itemDatabase).filter(item => 
            itemDatabase[item].obtainedFrom.includes('Defeat') || 
            itemDatabase[item].obtainedFrom.includes('dig') ||
            itemDatabase[item].obtainedFrom.includes('dungeon')
          ).slice(0, 10);

          return await interaction.reply({ 
            content: `❌ Sorry, I don't recognize the item "${charmItemName}". \n\n**Some charmable items:** ${charmableItems.join(', ')}\n\nUse \`/inspect item <item>\` to learn more about specific items, or \`/inspectplayer user <@user>\` to inspect other players.`, 
            ephemeral: true 
          });
        }

        // Set the pursuit
        setPursuit(user.id, charmItemName);

        const charmLuckBonus = charmPlayerStats.luck * 0.15;

        const charmEmbed = {
          color: 0x9932CC,
          title: '✨ Charm Activated!',
          description: `You are now pursuing **${charmItem.emoji} ${charmItemName}**`,
          fields: [
            {
              name: '🍀 Luck Bonus Details',
              value: `• Your luck increases drop chances for **${charmItemName}** by **${charmLuckBonus.toFixed(2)}%**\n• Each luck point gives **0.15%** bonus chance\n• Only affects the specific item you're charming\n• Use \`/charm <item>\` again to change targets`,
              inline: false,
            },
            {
              name: '🎯 Your Current Stats',
              value: `🍀 **Luck:** ${charmPlayerStats.luck} points\n📦 **Item Category:** ${charmItem.category}\n✨ **Enhanced Drop Rate:** Base + ${charmLuckBonus.toFixed(2)}%`,
              inline: false,
            },
            {
              name: '📍 Where to Find',
              value: charmItem.obtainedFrom,
              inline: false,
            },
          ],
          footer: {
            text: 'Your charm will persist until you change targets or restart the bot!',
          },
        };

        await interaction.reply({ embeds: [charmEmbed] });
        break;

      case 'gift':
        console.log('🎁 Gift command triggered by user:', user.username);
        
        try {
          // Get command parameters
          const giftTargetUser = interaction.options.getUser('user');
          const giftAmount = interaction.options.getInteger('amount');
          
          console.log('Gift parameters:', { 
            targetUser: giftTargetUser?.username, 
            targetUserId: giftTargetUser?.id, 
            amount: giftAmount,
            senderId: user.id,
            senderUsername: user.username
          });

          // Basic validation
          if (!giftTargetUser) {
            console.log('❌ No target user specified');
            return await interaction.reply({ 
              content: '❌ Please specify a valid user to gift coins to!', 
              ephemeral: true 
            });
          }

          if (!giftAmount || giftAmount < 10) {
            console.log('❌ Invalid gift amount:', giftAmount);
            return await interaction.reply({ 
              content: '❌ You must gift at least 10 Panda Coins!', 
              ephemeral: true 
            });
          }

          // Check if user is trying to gift to themselves
          if (giftTargetUser.id === user.id) {
            console.log('❌ User trying to gift to themselves');
            return await interaction.reply({ 
              content: '❌ You cannot gift coins to yourself!', 
              ephemeral: true 
            });
          }

          // Check if user is trying to gift to a bot
          if (giftTargetUser.bot) {
            console.log('❌ User trying to gift to bot');
            return await interaction.reply({ 
              content: '❌ You cannot gift coins to bots!', 
              ephemeral: true 
            });
          }

          // Calculate tax (10% rounded down)
          const taxAmount = Math.floor(giftAmount * 0.1);
          const totalCost = giftAmount + taxAmount;
          const actualGiftAmount = giftAmount; // Recipient gets full amount

          console.log('Gift calculations:', {
            giftAmount,
            taxAmount,
            totalCost,
            actualGiftAmount
          });

          // Check sender's balance
          const senderCoins = getUserCoins(user.id);
          const recipientCoins = getUserCoins(giftTargetUser.id);
          console.log('Before transaction - Sender balance:', senderCoins, 'Recipient balance:', recipientCoins);
          console.log('Sender balance check:', { senderCoins, required: totalCost });

          if (senderCoins < totalCost) {
            console.log('❌ Insufficient funds');
            return await interaction.reply({ 
              content: `❌ You don't have enough Panda Coins! You have ${senderCoins} 🐼 but need ${totalCost} 🐼 (${giftAmount} gift + ${taxAmount} tax).`, 
              ephemeral: true 
            });
          }

          // Process the gift transaction
          console.log('Processing gift transaction...');
          
          // Remove coins from sender
          const removeSuccess = removeCoins(user.id, totalCost);
          if (!removeSuccess) {
            console.log('❌ Failed to remove coins from sender');
            return await interaction.reply({ 
              content: '❌ Transaction failed while removing coins from your account. Please try again.', 
              ephemeral: true 
            });
          }

          // Add coins to recipient
          addCoins(giftTargetUser.id, actualGiftAmount, guild);
          console.log('✅ Gift transaction completed successfully');

          // Save data immediately
          savePandaCoinData();
          console.log('✅ Data saved to file');

          // Reload data to ensure consistency
          reloadPandaCoinData();
          
          // Check final balances
          const finalSenderCoins = getUserCoins(user.id);
          const finalRecipientCoins = getUserCoins(giftTargetUser.id);
          console.log('After transaction - Sender balance:', finalSenderCoins, 'Recipient balance:', finalRecipientCoins);

          // Create success embed
          const giftEmbed = {
            color: 0x00FF00,
            title: '🎁 Gift Sent Successfully!',
            description: `**${user.username}** gifted **${actualGiftAmount} Panda Coins** to **${giftTargetUser.username}**!`,
            fields: [
              {
                name: '💝 Gift Details',
                value: `🎯 **Recipient:** ${giftTargetUser.username}\n💰 **Gift Amount:** ${actualGiftAmount} 🐼\n💸 **Tax (10%):** ${taxAmount} 🐼\n🧾 **Total Cost:** ${totalCost} 🐼\n💰 **Your New Balance:** ${getUserCoins(user.id)} 🐼`,
                inline: false,
              },
            ],
            footer: {
              text: 'Spreading the panda love! 🐼 (Tax helps maintain the economy)',
            },
            timestamp: new Date().toISOString(),
          };

          // Send DM to recipient
          try {
            const recipientDMEmbed = {
              color: 0x00FF00,
              title: '🎁 You Received a Gift!',
              description: `**${user.username}** sent you **${actualGiftAmount} Panda Coins**!`,
              fields: [
                {
                  name: '💰 Your New Balance',
                  value: `${getUserCoins(giftTargetUser.id)} Panda Coins 🐼`,
                  inline: false,
                },
              ],
              footer: {
                text: `From: ${user.username} in ${guild.name}`,
              },
              timestamp: new Date().toISOString(),
            };

            await giftTargetUser.send({ embeds: [recipientDMEmbed] });
            console.log('✅ DM sent to recipient');
          } catch (dmError) {
            console.log('⚠️ Could not send DM to gift recipient (DMs may be disabled):', dmError.message);
          }

          // Reply to the interaction
          if (!interaction.replied) {
            await interaction.reply({ embeds: [giftEmbed] });
            console.log('✅ Gift command completed successfully');
          }

          // Check for role assignments for the recipient
          if (guild) {
            try {
              await checkAndAssignRoles(giftTargetUser.id, guild.id, guild);
              console.log('✅ Role assignment check completed');
            } catch (roleError) {
              console.log('⚠️ Role assignment check failed:', roleError.message);
            }
          }

        } catch (giftError) {
          console.error('❌ Error in gift command:', giftError);
          if (!interaction.replied) {
            await interaction.reply({ 
              content: '❌ An error occurred while processing your gift. Please try again or contact an administrator.', 
              ephemeral: true 
            });
          }
        }
        break;



      case 'battle':
        console.log('⚔️ Battle command triggered by user:', user.username);
        
        // Check if user is in any active battles
        let userBattles = [];
        Object.keys(multiplayerBattles).forEach(battleId => {
          const battle = multiplayerBattles[battleId];
          if (battle && battle.players.some(p => p.userId === user.id)) {
            userBattles.push({ battleId, battle });
          }
        });
        
        if (userBattles.length === 0) {
          await interaction.reply({ content: '❌ You are not in any active battles!', ephemeral: true });
          break;
        }
        
        // Show the most recent battle
        const latestBattle = userBattles[userBattles.length - 1];
        const battleEmbed = createBattleEmbed(latestBattle.battleId);
        
        if (!battleEmbed) {
          await interaction.reply({ content: '❌ Battle not found or not active!', ephemeral: true });
          break;
        }
        
        // Add attack buttons if it's the player's turn
        let attackRow = null;
        if (latestBattle.battle.status === 'active' && latestBattle.battle.currentTurn === 'players') {
          const currentPlayerId = latestBattle.battle.turnOrder[latestBattle.battle.currentPlayerIndex];
          if (currentPlayerId === user.id) {
            attackRow = {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1, // Primary style (blue)
                  label: '⚔️ Basic Attack',
                  custom_id: `multi_attack_${latestBattle.battleId}_basic`,
                  emoji: { name: '⚔️' },
                },
                {
                  type: 2,
                  style: 2, // Secondary style (gray)
                  label: '🛡️ Defend',
                  custom_id: `multi_attack_${latestBattle.battleId}_defend`,
                  emoji: { name: '🛡️' },
                },
              ],
            };
          }
        }
        
        const components = attackRow ? [attackRow] : [];
        await interaction.reply({ embeds: [battleEmbed], components: components });
        console.log('✅ Battle command completed successfully');
        break;

      default:
        await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    const errorMessage = 'There was an error while executing this command!';

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      }
    } catch (responseError) {
      console.error('Failed to send error response:', responseError);
    }
  }
});

// Periodic check for expired multiplayer battles and update embeds
setInterval(async () => {
  handleExpiredTurns();
  await updateMultiplayerBattleEmbeds();
}, 5000); // Check every 5 seconds for turns and embeds

client.login(process.env.DISCORD_BOT_TOKEN);

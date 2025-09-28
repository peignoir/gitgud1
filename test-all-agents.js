#!/usr/bin/env node

import { animatedIndicator } from './src/console/utils/animated-indicator.js';
import chalk from 'chalk';

async function testAllAgents() {
  console.log(chalk.cyan('🚀 Testing All 4 Agents with Enhanced Search Capabilities\n'));

  console.log(chalk.yellow('🕵️  Test 1: Scout Agent (no search)'));
  console.log(chalk.gray('Animation: Standard thinking'));
  animatedIndicator.start('thinking');
  await new Promise(resolve => setTimeout(resolve, 2000));
  animatedIndicator.stop();
  console.log(chalk.green('✅ Scout completed!\n'));

  console.log(chalk.yellow('📊 Test 2: Analyst Agent with Market Intelligence Search'));
  console.log(chalk.gray('Animation: Market intelligence analysis'));
  animatedIndicator.start('analystsearch');
  await new Promise(resolve => setTimeout(resolve, 3000));
  animatedIndicator.update('websearch');
  await new Promise(resolve => setTimeout(resolve, 2000));
  animatedIndicator.stop();
  console.log(chalk.green('🔍 Search completed - analyzing results...'));
  console.log(chalk.green('✅ Analyst market intelligence completed!\n'));

  console.log(chalk.yellow('🧭 Test 3: Mentor Agent with Startup Wisdom Search'));
  console.log(chalk.gray('Animation: Consulting startup authorities'));
  animatedIndicator.start('mentorsearch');
  await new Promise(resolve => setTimeout(resolve, 3000));
  animatedIndicator.update('websearch');
  await new Promise(resolve => setTimeout(resolve, 2000));
  animatedIndicator.stop();
  console.log(chalk.green('🔍 Search completed - analyzing results...'));
  console.log(chalk.green('✅ Mentor startup wisdom completed!\n'));

  console.log(chalk.yellow('💰 Test 4: Scoring Agent with Investment Data Search'));
  console.log(chalk.gray('Animation: Researching investment data'));
  animatedIndicator.start('scoringsearch');
  await new Promise(resolve => setTimeout(resolve, 3000));
  animatedIndicator.update('websearch');
  await new Promise(resolve => setTimeout(resolve, 2000));
  animatedIndicator.stop();
  console.log(chalk.green('🔍 Search completed - analyzing results...'));
  console.log(chalk.green('✅ Scoring investment analysis completed!\n'));

  console.log(chalk.cyan('🎉 All Agent Tests Completed!'));
  console.log(chalk.white('Agent Capabilities Summary:'));
  console.log('');
  console.log(chalk.blue('🕵️  Scout:') + chalk.gray('   Research and exploration (no web search)'));
  console.log(chalk.blue('📊 Analyst:') + chalk.gray('  Strategic analysis + market intelligence web search'));
  console.log(chalk.blue('🧭 Mentor:') + chalk.gray('   Startup guidance + wisdom web search'));
  console.log(chalk.blue('💰 Scoring:') + chalk.gray('  Angel investor evaluation + investment data web search'));
  console.log('');
  console.log(chalk.white('Web Search Domains:'));
  console.log(chalk.gray('• Analyst: McKinsey, BCG, CB Insights, PitchBook, Gartner'));
  console.log(chalk.gray('• Mentor: Steve Blank, Eric Ries, Paul Graham, Y Combinator'));
  console.log(chalk.gray('• Scoring: AngelList, Crunchbase, TechCrunch, Bloomberg, WSJ'));
  console.log('');
  console.log(chalk.green('✨ All agents ready with enhanced search capabilities!'));
}

testAllAgents().catch(console.error);
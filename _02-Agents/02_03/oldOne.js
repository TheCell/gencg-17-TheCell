
class Agent
{
	constructor(
		middlePointX,
		middlePointY,
		spawnX = middlePointX,
		spawnY = middlePointY,
		angle = random(0, Math.PI * 2),
		moveSpeed = options.moveSpeed,
		tileWidth = options.tileWidth,
		tileHeight = options.tileHeight,
		radius = options.tileWidth / 2)
	{
		// set properties
		this.moveSpeed = moveSpeed;
		this.points = [];
		this.agentAlive = true;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.radius = radius;
		this.pointRandom = options.randomPlacement;
		this.drawAllPoints = false;
		this.useRadius = options.useRadius;
		this.angle = angle;
		this.angleStep = Math.PI / 64;
		// this.angle = Math.PI / 2 + 0.03;
		// this.angle = Math.PI + 0.03;
		// this.angle = Math.PI * 3/2 + 0.03;
		// this.angle = 0 + 0.03;
		// this.angle = Math.PI / 4;
		// this.angle = Math.PI * 3/4;
		// this.angle = 0 - Math.PI * 1/4;
		// this.sendToNeighbor = options.sendToNeighbor;

		// set sendToNeighbor properties
		this.neighborCells = [];
		this.neighborCells[Agent.surroundingCellEnum.TOPLEFTCORNER] = {};
		this.neighborCells[Agent.surroundingCellEnum.TOP] = {};
		this.neighborCells[Agent.surroundingCellEnum.TOPRIGHTCORNER] = {};
		this.neighborCells[Agent.surroundingCellEnum.LEFT] = {};
		this.neighborCells[Agent.surroundingCellEnum.RIGHT] = {};
		this.neighborCells[Agent.surroundingCellEnum.BOTTOMLEFTCORNER] = {};
		this.neighborCells[Agent.surroundingCellEnum.BOTTOM] = {};
		this.neighborCells[Agent.surroundingCellEnum.BOTTOMRIGHTCORNER] = {};

		// set border properties
		this.hitTop = false;
		this.hitRight = false;
		this.hitBottom = false;
		this.hitLeft = false;
		this.hitTopWindowBorder = false;
		this.hitRightWindowBorder = false;
		this.hitBottomWindowBorder = false;
		this.hitLeftWindowBorder = false;

		// set middle point
		this.location = createVector(
			middlePointX,
			middlePointY);

		// draw the startingpoint
		let points;
		if (this.pointRandom)
		{
			let xPos = random(
				this.location.x - this.tileWidth / 2,
				this.location.x + this.tileWidth / 2);
			let yPos = random(
				this.location.y - this.tileHeight / 2,
				this.location.y + this.tileHeight / 2);
			points = createVector(xPos, yPos);
		}
		else
		{
			points = createVector(
				spawnX,
				spawnY);
		}

		this.points[0] = points;
	}

	drawLocation(drawAllPointsAnyway = false)
	{
		if (!this.agentAlive)
		{
			return;
		}

		// draw debug border
		if (window.debugMode)
		{
			stroke(color([150, 150, 150]));
			strokeWeight(1);
			// draw Right
			line(this.location.x + this.tileWidth / 2,
				this.location.y - this.tileHeight / 2,
				this.location.x + this.tileWidth / 2,
				this.location.y + this.tileHeight / 2);
			// draw Bottom
			line(this.location.x - this.tileWidth / 2,
				this.location.y + this.tileHeight / 2,
				this.location.x + this.tileWidth / 2,
				this.location.y + this.tileHeight / 2);
			stroke(color(options.agentColor));
			strokeWeight(options.agentFatness);
		}

		if (drawAllPointsAnyway)
		{
			for (let i = 0; i < this.points.length; i++)
			{
				point(this.points[i].x, this.points[i].y);
			}
		}
		else
		{
			if (this.drawAllPoints)
			{
				for (let i = 0; i < this.points.length; i++)
				{
					point(this.points[i].x, this.points[i].y);
				}
			}
			else
			{
				point(
					this.points[this.points.length - 1].x,
					this.points[this.points.length - 1].y);
			}
		}
	}

	updateCycle()
	{
		if (!this.agentAlive)
		{
			return;
		}

		let newX;
		let newY;

		// only change blocked Agents angle if they are not send to neighbors
		// and should not bounce
		if (!options.sendToNeighbor && !options.bounceOffLocalBorder)
		{
			if (
				cos(this.angle) < 0.01
				&& cos(this.angle) > -0.01
				&& ((this.points[this.points.length - 1].y
					>= this.location.y + this.tileHeight / 2)
					|| (this.points[this.points.length - 1].y
					<= this.location.y - this.tileHeight / 2)))
			{
				// check if it is at the top or bottom middle and speed it up a bit
				this.incrementAngle();
			}
			else if (
				sin(this.angle) < 0.01
				&& sin(this.angle) > -0.01
				&& ((this.points[this.points.length - 1].x
					>= this.location.x + this.tileWidth / 2)
					|| (this.points[this.points.length - 1].x
					<= this.location.x - this.tileWidth / 2)))
			{
				// check if it is at the left or right middle and speed it up a bit
				this.incrementAngle();
			}
		}
		newX = this.points[this.points.length - 1].x
			+ (cos(this.angle) * this.moveSpeed);
		newY = this.points[this.points.length - 1].y
			+ (sin(this.angle) * this.moveSpeed);

		// this must be after new positions checked
		// otherwise agents spawned in new tiles
		// will always hit borders at the start
		this.checkBorders(newX, newY);
		this.changeAngleBasedOnBorders();

		if (this.useRadius)
		{
			let aSquared = Math.pow(Math.abs(newX - this.location.x), 2);
			let bSquared = Math.pow(Math.abs(newY - this.location.y), 2);
			let cSquared = Math.pow(this.radius, 2);
			if (aSquared + bSquared < cSquared)
			{
				// all normal
			}
			else
			{
				// set the pos back a step
				newX = this.points[this.points.length - 1].x;
				newY = this.points[this.points.length - 1].y;

				if (
					this.angle > Math.PI / 2
					&& this.angle < Math.PI * 3/2)
				{
					this.incrementAngle();
				}
				else if ((this.angle < Math.PI / 2)
					|| this.angle > Math.PI * 3/2)
				{
					this.decrementAngle();
				}

				// kill
				this.agentAlive = false;

				/*
				if (this.angle > 0
					&& (this.angle < Math.PI
						|| this.angle > Math.PI * 3/2))
				{
					this.decrementAngle();
				}
				else
					*/

				// if (this.angle >= 0
				// 	&& this.angle < (Math.PI / 2))
				// {
				// 	// bottom right direction
				// 	// this.angle += angleStep;
				// 	this.incrementAngle();
				// }
				// else if (this.angle >= (Math.PI / 2)
				// 	&& this.angle < Math.PI)
				// {
				// 	// bottom left direction
				// 	// this.angle += angleStep;
				// 	this.incrementAngle();
				// }
				// else if (this.angle >= Math.PI
				// 	&& this.angle < (2 * Math.PI * 2 / 3))
				// {
				// 	// top left direction
				// 	// this.angle -= angleStep;
				// 	this.incrementAngle();
				// }
				// else if (this.angle >= (2 * Math.PI * 2 / 3)
				// 	&& this.angle < Math.PI * 2)
				// {
				// 	// top right direction
				// 	// this.angle += angleStep;
				// 	this.incrementAngle();
				// }
				// else
				// {
				// 	this.angle += angleStep;
				// }
			}
			// if (newX < (this.location.x - this.radius))
			// {
			// 	newX = this.location.x - this.radius;
			// }
			// else if (newX > (this.location.x + this.radius))
			// {
			// 	newX = this.location.x + this.radius;
			// }

			// if (newY < (this.location.y - this.radius))
			// {
			// 	newY = this.location.y - this.radius;
			// }
			// else if (newY > (this.location.y + this.radius))
			// {
			// 	newY = this.location.y + this.radius;
			// }
			if (this.angle > Math.PI * 2 || this.angle < 0)
			{
				this.agentAlive = false;
			}
		}
		else
		{
			if (!options.sendToNeighbor && !options.bounceOffLocalBorder)
			{
				// reset Position if local Border is met
				if (this.hitLeft)
				{
					newX = this.location.x - this.tileWidth / 2;
				}
				else if (this.hitRight)
				{
					newX = this.location.x + this.tileWidth / 2;
				}

				// top local Border
				if (this.hitTop)
				{
					newY = this.location.y - this.tileHeight / 2;
				}
				else if (this.hitBottom)
				{
					newY = this.location.y + this.tileHeight / 2;
				}
			}
			else if (!options.sendToNeighbor && options.bounceOffLocalBorder)
			{
				// reset Position if local Border is met
				if (this.hitLeft)
				{
					newX = this.location.x - this.tileWidth / 2;
				}
				else if (this.hitRight)
				{
					newX = this.location.x + this.tileWidth / 2;
				}

				// top local Border
				if (this.hitTop)
				{
					newY = this.location.y - this.tileHeight / 2;
				}
				else if (this.hitBottom)
				{
					newY = this.location.y + this.tileHeight / 2;
				}
			}
			else if (options.sendToNeighbor)
			{
				// if wall is hit
				// if (this.sendToNeighbor &&
				// 	(this.hitTop
				// 	|| this.hitBottom
				// 	|| this.hitLeft
				// 	|| this.hitRight)
				// 	&& !(this.hitTopWindowBorder
				// 		|| this.hitRightWindowBorder
				// 		|| this.hitBottomWindowBorder
				// 		|| this.hitLeftWindowBorder))
				// {
				// 	this.sendToNeighborCell(newX, newY);
				// }
				// if wall is hit
				if ((this.hitTop
					|| this.hitBottom
					|| this.hitLeft
					|| this.hitRight)
					&& !(this.hitTopWindowBorder
						|| this.hitRightWindowBorder
						|| this.hitBottomWindowBorder
						|| this.hitLeftWindowBorder))
				{
					this.sendToNeighborCell(newX, newY);
				}
			}

			// if (this.angle >= 0 && this.angle < Math.PI / 2)
			// {
			// 	// bottom right direction
			// }
			// else if (this.angle >= Math.PI / 2 && this.angle < Math.PI)
			// {
			// 	// bottom left direction
			// }
			// else if (this.angle >= Math.PI && this.angle < 2 * Math.PI / 3)
			// {
			// 	// top left direction
			// }
			// else
			// {
			// 	// top right direction
			// }

			this.customBehaviour();
		}

		let newP = createVector(newX, newY);
		this.points.push(newP);
	}

	incrementAngle()
	{
		this.angle += this.angleStep;
	}

	decrementAngle()
	{
		this.angle -= this.angleStep;
	}

	setNeighbor(neighborNumber, tileinformation)
	{
		this.neighborCells[neighborNumber] = tileinformation;
	}

	sendToNeighborCell(startX, startY)
	{
		let cellinformation;
		// TODO
		// TODO later: break this apart for exchangable neighbors
		if (this.hitTop && this.hitRight)
		{
			console.log("top right send neighbor");
			// top right corner
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.TOPRIGHTCORNER];
		}
		else if (this.hitBottom && this.hitRight)
		{
			// bottom right corner
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.BOTTOMRIGHTCORNER];
		}
		else if (this.hitBottom && this.hitLeft)
		{
			// bottom left corner
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.BOTTOMLEFTCORNER];
		}
		else if (this.hitTop && this.hitLeft)
		{
			// top left corner
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.TOPLEFTCORNER];
		}
		else if (this.hitTop)
		{
			// Top
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.TOP];
		}
		else if (this.hitRight)
		{
			// Right
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.RIGHT];
		}
		else if (this.hitBottom)
		{
			// Bottom
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.BOTTOM];
			// console.log("hitBottom", this.location, cellinformation);
		}
		else if (this.hitLeft)
		{
			// Left
			cellinformation = this
				.neighborCells[Agent.surroundingCellEnum.LEFT];
		}

		if (cellinformation.centerX
			&& cellinformation.centerY
			&& cellinformation.tileWidth
			&& cellinformation.tileHeight
			&& cellinformation.radius)
		{
			let agent = new Agent(
				cellinformation.centerX,
				cellinformation.centerY,
				startX,
				startY,
				this.angle,
				this.moveSpeed,
				cellinformation.tileWidth,
				cellinformation.tileHeight,
				cellinformation.radius);

			// check for borders and update all neighborcells
			// top border
			agent.neighborCells[Agent.surroundingCellEnum.TOP] =
				new Tileinformation(
					agent.location.x,
					agent.location.y - agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// set right border
			agent.neighborCells[Agent.surroundingCellEnum.RIGHT] =
				new Tileinformation(
					agent.location.x + agent.tileWidth,
					agent.location.y,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// set Bottom border
			agent.neighborCells[Agent.surroundingCellEnum.BOTTOM] =
				new Tileinformation(
					agent.location.x,
					agent.location.y + agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// left border
			agent.neighborCells[Agent.surroundingCellEnum.LEFT] =
				new Tileinformation(
					agent.location.x - agent.tileWidth,
					agent.location.y,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// edge Cases
			// top right Border
			agent.neighborCells[Agent.surroundingCellEnum.TOPRIGHTCORNER] =
				new Tileinformation(
					agent.location.x + agent.tileWidth,
					agent.location.y - agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// bottom right
			agent.neighborCells[Agent.surroundingCellEnum.BOTTOMRIGHTCORNER] =
				new Tileinformation(
					agent.location.x + agent.tileWidth,
					agent.location.y + agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// bottom left
			agent.neighborCells[Agent.surroundingCellEnum.BOTTOMLEFTCORNER] =
				new Tileinformation(
					agent.location.x - agent.tileWidth,
					agent.location.y + agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			// top left
			agent.neighborCells[Agent.surroundingCellEnum.TOPLEFTCORNER] =
				new Tileinformation(
					agent.location.x - agent.tileWidth,
					agent.location.y - agent.tileHeight,
					agent.tileWidth,
					agent.tileHeight,
					agent.radius);

			agents.push(agent);
		}

		this.agentAlive = false;
	}

	checkBorders(xCoord, yCoord)
	{
		this.hitTop = false;
		this.hitRight = false;
		this.hitBottom = false;
		this.hitLeft = false;
		this.hitTopWindowBorder = false;
		this.hitRightWindowBorder = false;
		this.hitBottomWindowBorder = false;
		this.hitLeftWindowBorder = false;

		// check if hit a window border
		if (xCoord > windowWidth)
		{
			this.hitRightWindowBorder = true;
		}
		else if (xCoord < 0)
		{
			this.hitLeftWindowBorder = true;
		}

		if (yCoord > windowHeight)
		{
			this.hitBottomWindowBorder = true;
		}
		else if (yCoord < 0)
		{
			this.hitTopWindowBorder = true;
		}

		if (this.useRadius)
		{
			// TODO
		}
		else
		{
			// left local border
			if (xCoord < (this.location.x - this.tileWidth / 2))
			{
				this.hitLeft = true;
			}
			else if (xCoord > (this.location.x + this.tileWidth / 2))
			{
				this.hitRight = true;
			}

			// top local Border
			if (yCoord < (this.location.y - this.tileHeight / 2))
			{
				this.hitTop = true;
			}
			else if (yCoord > (this.location.y + this.tileHeight / 2))
			{
				this.hitBottom = true;
			}
		}
	}

	changeAngleBasedOnBorders()
	{
		if (options.bounceOffWindowBorder)
		{
			if(this.hitTopWindowBorder)
			{
				this.angle = random(0, Math.PI);
			}
			if (this.hitRightWindowBorder)
			{
				this.angle = random(Math.PI / 2, Math.PI * 3/2)
			}
			if (this.hitBottomWindowBorder)
			{
				this.angle = random(Math.PI, Math.PI * 2);
			}
			if (this.hitLeftWindowBorder)
			{
				this.angle = random(Math.PI / 2, Math.PI * 3/2)
					+ Math.PI;
			}

			// edge cases
			if (this.hitTopWindowBorder && this.hitRightWindowBorder)
			{
				this.angle = random(Math.PI / 2, Math.PI);
			}
			if (this.hitRightWindowBorder && this.hitBottomWindowBorder)
			{
				this.angle = random(Math.PI, Math.PI * 3/2);
			}
			if (this.hitBottomWindowBorder && this.hitLeftWindowBorder)
			{
				this.angle = random(Math.PI * 3/2, Math.PI * 2);
			}
			if (this.hitLeftWindowBorder && this.hitTopWindowBorder)
			{
				this.angle = random(0, Math.PI / 2);
			}
		}

		if (options.sendToNeighbor)
		{
			return;
		}

		if (options.bounceOffLocalBorder
			&& this.useRadius
			&& (this.hitTop
			|| this.hitBottom
			|| this.hitLeft
			|| this.hitRight))
		{
			// TODO
			// using radius
		}
		else if (options.bounceOffLocalBorder
			&& !this.useRadius
			&& (this.hitTop
			|| this.hitBottom
			|| this.hitLeft
			|| this.hitRight))
		{
			if(this.hitTop)
			{
				this.angle = random(0, Math.PI);
			}
			if (this.hitRight)
			{
				this.angle = random(Math.PI / 2, Math.PI * 3/2)
			}
			if (this.hitBottom)
			{
				this.angle = random(Math.PI, Math.PI * 2);
			}
			if (this.hitLeft)
			{
				this.angle = random(Math.PI / 2, Math.PI * 3/2)
					+ Math.PI;
			}

			// edge cases
			if (this.hitTop && this.hitRight)
			{
				this.angle = random(Math.PI / 2, Math.PI);
			}
			if (this.hitBottom)
			{
				this.angle = random(Math.PI, Math.PI * 3/2);
			}
			if (this.hitBottom)
			{
				this.angle = random(Math.PI * 3/2, Math.PI * 2);
			}
			if (this.hitLeft && this.hitTop)
			{
				this.angle = random(0, Math.PI / 2);
			}
		}
	}

	customBehaviour()
	{
		// Agent custom behaviour comes here
	}
}

/**
 * NeighborCells Names
 * @type {Integer}
 */
Agent.surroundingCellEnum = {
	TOPLEFTCORNER: 0,
	TOP: 1,
	TOPRIGHTCORNER: 2,
	LEFT: 3,
	RIGHT: 4,
	BOTTOMLEFTCORNER: 5,
	BOTTOM: 6,
	BOTTOMRIGHTCORNER: 7
}

class Tileinformation
{
	constructor(
		centerX,
		centerY,
		tileWidth = options.tileWidth,
		tileHeight = options.tileHeight,
		radius = options.tileWidth / 2)
	{
		this.centerX = centerX,
		this.centerY = centerY,
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.radius = radius;
	}
}